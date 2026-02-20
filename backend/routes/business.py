"""
FraudSense — Business Blueprint
Handles business registration, retrieval, and editing.
"""

import logging
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session

from database import SessionLocal, Business
from firebase_middleware import verify_firebase_token

logger = logging.getLogger("fraudsense.business")

business_bp = Blueprint("business", __name__, url_prefix="/business")


@business_bp.route("/", methods=["POST"])
def add_business():
    """POST /business/ — Register a new business."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ["business_name", "email"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    session = SessionLocal()
    try:
        existing = session.query(Business).filter(
            Business.email == data["email"]
        ).first()
        if existing:
            return jsonify({"error": "Email already registered"}), 409

        biz = Business(
            business_name = data["business_name"],
            email         = data["email"],
            category      = data.get("category", "General"),
        )
        session.add(biz)
        session.commit()
        session.refresh(biz)

        return jsonify({
            "data":  {"business_id": biz.id, "business_name": biz.business_name},
            "error": None,
        }), 201

    except Exception as e:
        session.rollback()
        logger.exception("add_business error")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@business_bp.route("/me", methods=["GET"])
def get_my_business():
    """GET /business/me — Get authenticated business details."""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    session = SessionLocal()
    try:
        biz = session.query(Business).filter(
            Business.firebase_uid == decoded["uid"]
        ).first()
        if not biz:
            return jsonify({"error": "Business not registered"}), 404

        return jsonify({"data": _biz_to_dict(biz), "error": None}), 200
    finally:
        session.close()


@business_bp.route("/me", methods=["PATCH"])
def edit_business():
    """PATCH /business/me — Update business name or category."""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    data = request.get_json() or {}
    session = SessionLocal()
    try:
        biz = session.query(Business).filter(
            Business.firebase_uid == decoded["uid"]
        ).first()
        if not biz:
            return jsonify({"error": "Business not found"}), 404

        if "business_name" in data:
            biz.business_name = data["business_name"]
        if "category" in data:
            biz.category = data["category"]

        session.commit()
        return jsonify({"data": _biz_to_dict(biz), "error": None}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@business_bp.route("/link", methods=["POST"])
def link_firebase():
    """POST /business/link — Link Firebase UID to an existing business account."""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        return jsonify({"error": "email required"}), 400

    session = SessionLocal()
    try:
        biz = session.query(Business).filter(Business.email == email).first()
        if not biz:
            return jsonify({"error": "No business found with that email"}), 404

        biz.firebase_uid = decoded["uid"]
        session.commit()

        return jsonify({
            "data":  {"business_id": biz.id, "firebase_uid": biz.firebase_uid},
            "error": None,
        }), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@business_bp.route("/all", methods=["GET"])
def list_businesses():
    """GET /business/all — List all businesses (admin)."""
    decoded, err = verify_firebase_token()
    if err:
        return err, 401

    session = SessionLocal()
    try:
        all_biz = session.query(Business).all()
        return jsonify({
            "data":  [_biz_to_dict(b) for b in all_biz],
            "error": None,
        }), 200
    finally:
        session.close()


def _biz_to_dict(b: Business) -> dict:
    return {
        "id":                b.id,
        "business_name":     b.business_name,
        "email":             b.email,
        "category":          b.category,
        "total_transactions": b.total_transactions,
        "risk_count":        b.risk_count,
        "risk_score":        b.risk_score,
    }
