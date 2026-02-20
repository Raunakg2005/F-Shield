"""
FraudSense — Transactions Blueprint
Handles CSV upload, per-row fraud analysis, transaction retrieval,
SHAP explanation endpoint, and review feedback loop.
"""

import io
import csv
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session

from database import SessionLocal, Transaction, Business
from firebase_middleware import verify_firebase_token
from fraud_engine.engine import analyze

logger = logging.getLogger("fraudsense.transactions")

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")


def _get_biz(session: Session, uid: str):
    """Return Business or auto-create one for seamless dev."""
    biz = session.query(Business).filter(Business.firebase_uid == uid).first()
    if not biz:
        try:
            from firebase_admin import auth
            user = auth.get_user(uid)
            email = user.email or f"{uid}@demo.com"
            name = user.display_name or email.split('@')[0]
        except Exception:
            email = f"{uid}@demo.com"
            name = "Demo Business"
        biz = Business(
            firebase_uid=uid,
            business_name=name,
            email=email,
            category="FinTech"
        )
        session.add(biz)
        session.commit()
        session.refresh(biz)
    return biz


# ── Upload CSV ─────────────────────────────────────────────────────────────────
@transactions_bp.route("/upload", methods=["POST"])
def upload_transactions():
    """
    POST /transactions/upload
    Body: multipart/form-data with 'file' (CSV) or JSON array
    Returns per-row fraud verdicts and persists to DB.
    """
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    uid = decoded["uid"]
    session = SessionLocal()
    try:
        biz = _get_biz(session, uid)
        if not biz:
            return jsonify({"error": "Business not found"}), 404

        # --- Parse input ---
        rows = []
        if request.files.get("file"):
            file = request.files["file"]
            text = file.read().decode("utf-8")
            reader = csv.DictReader(io.StringIO(text))
            rows = list(reader)
        elif request.is_json:
            data = request.get_json()
            if isinstance(data, list):
                rows = data
            else:
                return jsonify({"error": "JSON body must be an array of transactions"}), 400
        else:
            return jsonify({"error": "Provide CSV file (multipart) or JSON array"}), 400

        if not rows:
            return jsonify({"error": "No rows found in upload"}), 400

        # --- Compute business average from existing transactions ---
        existing_txns  = session.query(Transaction).filter(
            Transaction.business_id == biz.id
        ).all()
        existing_amounts = [t.amount for t in existing_txns if t.amount]
        biz_avg = sum(existing_amounts) / len(existing_amounts) if existing_amounts else 0

        results = []
        fraud_count = 0

        for i, row in enumerate(rows):
            # Coerce types
            tx = {
                "amount":           float(row.get("amount", 0) or 0),
                "vendor_name":      str(row.get("vendor_name", row.get("name", f"vendor_{i}")) or ""),
                "category":         str(row.get("category", "") or ""),
                "payment_method":   str(row.get("payment_method", "") or ""),
                "timestamp":        str(row.get("timestamp", row.get("date",
                                        datetime.now(timezone.utc).isoformat())) or ""),
                "previous_balance": float(row.get("previous_balance", 0) or 0),
                "new_balance":      float(row.get("new_balance", 0) or 0),
                "ip_country":       str(row.get("ip_country", "") or ""),
                "vendor_country":   str(row.get("vendor_country", "") or ""),
                "time_since_last_txn": float(row.get("time_since_last_txn", 3600) or 3600),
                "num_txns_last_1h":    int(float(row.get("num_txns_last_1h", 0) or 0)),
                "num_txns_last_24h":   int(float(row.get("num_txns_last_24h", 0) or 0)),
                "vendor_risk_score":   float(row.get("vendor_risk_score", 0) or 0),
                "is_new_vendor":       int(float(row.get("is_new_vendor", 0) or 0)),
            }

            # Run 4-layer fraud engine
            verdict = analyze(tx, biz.id, biz_avg)

            # Persist to DB
            db_tx = Transaction(
                business_id      = biz.id,
                amount           = tx["amount"],
                vendor_name      = tx["vendor_name"],
                category         = tx["category"],
                payment_method   = tx["payment_method"],
                timestamp        = tx["timestamp"],
                previous_balance = tx["previous_balance"],
                new_balance      = tx["new_balance"],
                suspicious_flag  = verdict.is_fraud,
                risk_level       = verdict.risk_level,
                confidence_score = verdict.confidence,
                final_score      = verdict.final_score,
                fraud_reasons    = str([f.message for f in verdict.flags]),
                shap_reasons     = str(verdict.shap_reasons),
                review_status    = "pending_review" if verdict.review_required else "auto_cleared",
            )
            session.add(db_tx)

            if verdict.is_fraud:
                fraud_count += 1

            results.append({
                "row":     i,
                "vendor":  tx["vendor_name"],
                "amount":  tx["amount"],
                "verdict": verdict.to_dict(),
            })

        # Update business stats
        biz.total_transactions = (biz.total_transactions or 0) + len(rows)
        biz.risk_count         = (biz.risk_count or 0) + fraud_count
        if biz.total_transactions > 0:
            biz.risk_score = round(biz.risk_count / biz.total_transactions * 100, 2)

        session.commit()

        return jsonify({
            "data": {
                "total":       len(rows),
                "fraud_count": fraud_count,
                "results":     results,
            },
            "error": None,
        }), 200

    except Exception as e:
        session.rollback()
        logger.exception("Upload error")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


# ── Get Transactions ───────────────────────────────────────────────────────────
@transactions_bp.route("/", methods=["GET"])
def get_transactions():
    """GET /transactions/?page=1&limit=50&risk_level=high&suspicious=true"""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    uid = decoded["uid"]
    session = SessionLocal()
    try:
        biz = _get_biz(session, uid)
        if not biz:
            return jsonify({"error": "Business not found"}), 404

        page  = max(1, int(request.args.get("page", 1)))
        limit = min(200, int(request.args.get("limit", 50)))
        risk_level  = request.args.get("risk_level")
        suspicious  = request.args.get("suspicious")

        q = session.query(Transaction).filter(Transaction.business_id == biz.id)

        if risk_level:
            q = q.filter(Transaction.risk_level == risk_level)
        if suspicious and suspicious.lower() == "true":
            q = q.filter(Transaction.suspicious_flag == True)

        total = q.count()
        txns  = q.order_by(Transaction.id.desc()) \
                  .offset((page - 1) * limit).limit(limit).all()

        return jsonify({
            "data": {
                "transactions": [_tx_to_dict(t) for t in txns],
                "total":        total,
                "page":         page,
                "limit":        limit,
                "pages":        (total + limit - 1) // limit,
            },
            "error": None,
        }), 200

    finally:
        session.close()

# ── Get Single Transaction ──────────────────────────────────────────────────────
@transactions_bp.route("/<int:txn_id>", methods=["GET"])
def get_transaction(txn_id: int):
    """GET /transactions/<id> — return a single transaction"""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    session = SessionLocal()
    try:
        uid = decoded["uid"]
        biz = _get_biz(session, uid)
        if not biz:
            return jsonify({"error": "Business not found"}), 404

        txn = session.query(Transaction).filter(
            Transaction.id == txn_id,
            Transaction.business_id == biz.id
        ).first()

        if not txn:
            return jsonify({"error": "Transaction not found"}), 404

        return jsonify({
            "data": _tx_to_dict(txn),
            "error": None
        }), 200
    finally:
        session.close()

# ── Explain Transaction ────────────────────────────────────────────────────────
@transactions_bp.route("/<int:txn_id>/explain", methods=["GET"])
def explain_transaction_endpoint(txn_id: int):
    """GET /transactions/<id>/explain — return SHAP reasons + rule flags"""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    session = SessionLocal()
    try:
        txn = session.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            return jsonify({"error": "Transaction not found"}), 404

        import ast
        reasons  = []
        rule_flags = []
        try:
            reasons    = ast.literal_eval(txn.shap_reasons  or "[]")
            rule_flags = ast.literal_eval(txn.fraud_reasons or "[]")
        except Exception:
            pass

        return jsonify({
            "data": {
                "transaction_id":  txn_id,
                "is_fraud":        txn.suspicious_flag,
                "risk_level":      txn.risk_level,
                "confidence":      txn.confidence_score,
                "final_score":     txn.final_score,
                "shap_reasons":    reasons,
                "rule_flags":      rule_flags,
                "review_status":   txn.review_status,
            },
            "error": None,
        }), 200
    finally:
        session.close()


# ── Review Feedback ────────────────────────────────────────────────────────────
@transactions_bp.route("/<int:txn_id>/review", methods=["PATCH"])
def review_transaction(txn_id: int):
    """
    PATCH /transactions/<id>/review
    Body: {"status": "confirmed_fraud" | "false_positive" | "pending_review"}
    Implements the human feedback loop.
    """
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    data = request.get_json() or {}
    status = data.get("review_status") or data.get("status")
    VALID  = {"confirmed_fraud", "false_positive", "pending_review", "auto_cleared"}
    if status not in VALID:
        return jsonify({"error": f"status must be one of {sorted(VALID)}"}), 400

    session = SessionLocal()
    try:
        txn = session.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            return jsonify({"error": "Transaction not found"}), 404

        txn.review_status = status
        txn.reviewed_by   = decoded["uid"]
        session.commit()

        return jsonify({
            "data": _tx_to_dict(txn),
            "error": None,
        }), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


def _tx_to_dict(t: Transaction) -> dict:
    import ast
    return {
        "id":              t.id,
        "amount":          t.amount,
        "vendor_name":     t.vendor_name,
        "category":        t.category,
        "payment_method":  t.payment_method,
        "timestamp":       str(t.timestamp) if t.timestamp else None,
        "suspicious_flag": t.suspicious_flag,
        "risk_level":      t.risk_level,
        "confidence":      t.confidence_score,
        "final_score":     t.final_score,
        "review_status":   t.review_status,
        "fraud_reasons":   ast.literal_eval(t.fraud_reasons or "[]") if t.fraud_reasons else [],
        "shap_reasons":    ast.literal_eval(t.shap_reasons or "[]") if t.shap_reasons else [],
    }
