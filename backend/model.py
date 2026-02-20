"""
FraudSense — Model Loader
Loads the trained fraud pipeline and exposes predict_fraud().
"""

import os
import json
import numpy as np
import joblib
from typing import Optional

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "fraud_pipeline.pkl")
LOG_PATH   = os.path.join(BASE_DIR, "training_log.json")

# Feature column order must match training
FEATURE_COLS = [
    "amount",
    "hour_of_day",
    "day_of_week",
    "time_since_last_txn",
    "num_txns_last_1h",
    "num_txns_last_24h",
    "amount_vs_avg_ratio",
    "country_mismatch",
    "high_risk_country",
    "is_crypto_category",
    "is_new_vendor",
    "vendor_risk_score",
    "payment_method_encoded",
    "balance_drop_ratio",
    "round_amount",
    "is_after_hours",
]

PAYMENT_ENC = {
    "credit_card": 0,
    "debit_card": 1,
    "wire_transfer": 2,
    "crypto": 3,
    "ach": 4
}

HIGH_RISK_COUNTRIES = {"NG", "RU", "KP", "IR", "VE", "UA", "BY", "MM"}


# ─── Load model at import time ────────────────────────────────────────────────
_model_bundle: Optional[dict] = None

def _load_model():
    global _model_bundle
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Run `python ml/train_model.py` first."
        )
    _model_bundle = joblib.load(MODEL_PATH)
    print(f"[FraudSense] Model loaded from {MODEL_PATH}")

    if os.path.exists(LOG_PATH):
        with open(LOG_PATH) as f:
            log = json.load(f)
        print(f"[FraudSense] Trained: {log.get('trained_at')} | "
              f"Test ROC-AUC: {log.get('test_metrics', {}).get('roc_auc', 'N/A')}")


try:
    _load_model()
except FileNotFoundError as e:
    print(f"[FraudSense] WARNING: {e}")
    _model_bundle = None


# ─── Feature extraction ───────────────────────────────────────────────────────
def _build_feature_vector(tx: dict) -> list:
    """
    Converts a raw transaction dict (from DB row or request JSON)
    into the ordered feature vector expected by the model.
    """
    from datetime import datetime

    # Parse timestamp
    ts_raw = tx.get("timestamp") or tx.get("date") or ""
    try:
        ts = datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00"))
        hour_of_day = ts.hour
        day_of_week = ts.weekday()
    except Exception:
        hour_of_day = 12
        day_of_week = 0

    amount = float(tx.get("amount", 0) or 0)
    prev_balance = float(tx.get("previous_balance", 0) or 1)
    new_balance  = float(tx.get("new_balance", 0) or 0)
    balance_drop = max(0, prev_balance - new_balance)
    balance_drop_ratio = balance_drop / max(1.0, prev_balance)

    ip_country     = str(tx.get("ip_country", "") or "")
    vendor_country = str(tx.get("vendor_country", "") or "")
    country_mismatch  = int(bool(ip_country and vendor_country and ip_country != vendor_country))
    high_risk_country = int(vendor_country in HIGH_RISK_COUNTRIES)

    category = str(tx.get("category", "") or "").lower()
    is_crypto = int("crypto" in category or category == "cryptocurrency")

    vendor_name = str(tx.get("vendor_name", "") or "")
    is_new_vendor = int(tx.get("is_new_vendor", 0) or "new" in vendor_name.lower())

    payment_method = str(tx.get("payment_method", "") or "").lower()
    payment_enc = PAYMENT_ENC.get(payment_method, 0)

    business_avg = float(tx.get("business_avg_amount", amount) or amount)
    amount_vs_avg = amount / max(1.0, business_avg)

    round_amount = int(amount > 0 and (amount % 1000 < 1 or amount % 500 < 1))
    is_after_hours = int(hour_of_day < 5 or hour_of_day > 22)

    return [
        amount, hour_of_day, day_of_week,
        float(tx.get("time_since_last_txn", 3600) or 3600),
        int(tx.get("num_txns_last_1h", 0) or 0),
        int(tx.get("num_txns_last_24h", 0) or 0),
        round(amount_vs_avg, 4),
        country_mismatch, high_risk_country,
        is_crypto, is_new_vendor,
        float(tx.get("vendor_risk_score", 0.1) or 0.1),
        payment_enc,
        round(balance_drop_ratio, 4),
        round_amount, is_after_hours,
    ]


# ─── Public API ───────────────────────────────────────────────────────────────
def predict_fraud(tx: dict) -> dict:
    """
    Classify a single transaction using calibrated XGBoost probabilities.
    Returns: {is_fraud, confidence, risk_level, shap_reasons}
    """
    if _model_bundle is None:
        return {"is_fraud": False, "confidence": 0.0, "risk_level": "low", "shap_reasons": []}

    scaler     = _model_bundle["scaler"]
    calibrated = _model_bundle["calibrated"]
    threshold  = _model_bundle["threshold"]

    features   = np.array(_build_feature_vector(tx), dtype=float).reshape(1, -1)
    features_sc = scaler.transform(features)
    prob       = float(calibrated.predict_proba(features_sc)[0][1])
    is_fraud   = prob >= threshold

    if prob >= 0.80:
        risk_level = "critical"
    elif prob >= 0.60:
        risk_level = "high"
    elif prob >= 0.35:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "is_fraud":    bool(is_fraud),
        "confidence":  round(prob, 4),
        "risk_level":  risk_level,
        "shap_reasons": []
    }


def get_model_metadata() -> dict:
    if not os.path.exists(LOG_PATH):
        return {"status": "no_model"}
    with open(LOG_PATH) as f:
        return json.load(f)

