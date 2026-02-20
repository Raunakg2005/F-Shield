"""
FraudSense — Fraud/Admin Blueprint
Alerts feed, aggregated stats, blacklist management,
network graph export, and model health endpoint.
"""

import logging
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import SessionLocal, Transaction, Business
from firebase_middleware import verify_firebase_token
from model import get_model_metadata
from fraud_engine.network import get_vendor_graph

logger = logging.getLogger("fraudsense.fraud")

fraud_bp = Blueprint("fraud", __name__, url_prefix="/fraud")


# ── Alerts feed ───────────────────────────────────────────────────────────────
@fraud_bp.route("/alerts", methods=["GET"])
def get_alerts():
    """
    GET /fraud/alerts?page=1&limit=20&risk_level=critical&review_status=pending_review
    Returns paginated high-risk transactions for the alert investigation feed.
    """
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    session = SessionLocal()
    try:
        uid  = decoded["uid"]
        biz  = _get_biz(session, uid)
        if not biz:
            return jsonify({"error": "Business not found"}), 404

        page         = max(1, int(request.args.get("page", 1)))
        limit        = min(100, int(request.args.get("limit", 20)))
        risk_level   = request.args.get("risk_level")
        review_stat  = request.args.get("status")
        
        if review_stat == "pending":
            review_stat = "pending_review"

        q = session.query(Transaction).filter(
            Transaction.business_id   == biz.id,
            Transaction.suspicious_flag == True
        )
        if risk_level:
            q = q.filter(Transaction.risk_level == risk_level)
        if review_stat:
            q = q.filter(Transaction.review_status == review_stat)

        total  = q.count()
        alerts = q.order_by(Transaction.id.desc()) \
                   .offset((page - 1) * limit).limit(limit).all()

        return jsonify({
            "data": {
                "alerts": [_alert_to_dict(a) for a in alerts],
                "total":  total,
                "page":   page,
                "pages":  (total + limit - 1) // limit,
            },
            "error": None,
        }), 200
    finally:
        session.close()


# ── Dashboard Stats ───────────────────────────────────────────────────────────
@fraud_bp.route("/stats", methods=["GET"])
def get_stats():
    """GET /fraud/stats — aggregated dashboard numbers."""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    session = SessionLocal()
    try:
        uid = decoded["uid"]
        biz = _get_biz(session, uid)
        if not biz:
            return jsonify({"error": "Business not found"}), 404

        total   = session.query(func.count(Transaction.id)).filter(
            Transaction.business_id == biz.id).scalar() or 0
        fraud   = session.query(func.count(Transaction.id)).filter(
            Transaction.business_id == biz.id,
            Transaction.suspicious_flag == True).scalar() or 0
        pending = session.query(func.count(Transaction.id)).filter(
            Transaction.business_id == biz.id,
            Transaction.review_status == "pending_review").scalar() or 0

        # Risk breakdown
        breakdown = {}
        for level in ["critical", "high", "medium", "low"]:
            count = session.query(func.count(Transaction.id)).filter(
                Transaction.business_id == biz.id,
                Transaction.risk_level  == level).scalar() or 0
            breakdown[level] = count

        # Recent trend (last 10 fraud transactions)
        recent = session.query(Transaction).filter(
            Transaction.business_id   == biz.id,
            Transaction.suspicious_flag == True,
        ).order_by(Transaction.id.desc()).limit(10).all()

        return jsonify({
            "data": {
                "total_transactions":   total,
                "fraud_count":          fraud,
                "fraud_rate":           round(fraud / total * 100, 2) if total else 0,
                "pending_review":       pending,
                "risk_breakdown":       breakdown,
                "risk_score":           biz.risk_score or 0,
                "recent_fraud":         [_alert_to_dict(t) for t in recent],
            },
            "error": None,
        }), 200
    finally:
        session.close()


# ── Network Graph ────────────────────────────────────────────────────────────
@fraud_bp.route("/network", methods=["GET"])
def get_network_graph():
    """GET /fraud/network — export vendor graph JSON for visualization."""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    session = SessionLocal()
    try:
        uid = decoded["uid"]
        biz = _get_biz(session, uid)
        if not biz:
            return jsonify({"error": "Business not found"}), 404

        graph_data = get_vendor_graph().get_graph_json(business_id=biz.id)
        return jsonify({"data": graph_data, "error": None}), 200
    finally:
        session.close()


# ── Model Health ──────────────────────────────────────────────────────────────
@fraud_bp.route("/model/health", methods=["GET"])
def model_health():
    """GET /fraud/model/health — model metadata and training summary."""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    meta = get_model_metadata()
    return jsonify({"data": meta, "error": None}), 200


def _alert_to_dict(t: Transaction) -> dict:
    import ast
    reasons = []
    try:
        reasons = ast.literal_eval(t.fraud_reasons or "[]")
    except Exception:
        pass

    return {
        "id":            t.id,
        "amount":        t.amount,
        "vendor_name":   t.vendor_name,
        "category":      t.category,
        "timestamp":     str(t.timestamp) if t.timestamp else None,
        "risk_level":    t.risk_level,
        "confidence":    t.confidence_score,
        "final_score":   t.final_score,
        "review_status": t.review_status,
        "reasons":       reasons,
    }

def _get_biz(session: Session, uid: str):
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
