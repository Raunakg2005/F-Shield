"""
FraudSense — SHAP Explainer (Layer 3)
Generates human-readable reason strings for each fraud prediction.
"""

import os
import numpy as np
import pandas as pd
import shap
import joblib
from typing import Optional

BASE_DIR    = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH  = os.path.join(BASE_DIR, "fraud_pipeline.pkl")

# Feature → human-readable description map
FEATURE_LABELS = {
    "amount":                "Transaction amount",
    "hour_of_day":           "Hour of day",
    "day_of_week":           "Day of week",
    "time_since_last_txn":   "Time since last transaction",
    "num_txns_last_1h":      "Number of transactions in last 1h",
    "num_txns_last_24h":     "Number of transactions in last 24h",
    "amount_vs_avg_ratio":   "Amount vs business average ratio",
    "country_mismatch":      "Country mismatch (IP vs vendor)",
    "high_risk_country":     "High-risk vendor country",
    "is_crypto_category":    "Cryptocurrency category",
    "is_new_vendor":         "New/unknown vendor",
    "vendor_risk_score":     "Vendor risk score",
    "payment_method_encoded":"Payment method",
    "balance_drop_ratio":    "Balance drain ratio",
    "round_amount":          "Suspiciously round amount",
    "is_after_hours":        "After business hours",
}


class FraudExplainer:
    """Loads XGBoost base model and produces SHAP-derived text reasons."""

    def __init__(self):
        self._explainer: Optional[shap.TreeExplainer] = None
        self._scaler = None
        self._feature_cols = None
        self._load()

    def _load(self):
        if not os.path.exists(MODEL_PATH):
            return
        bundle = joblib.load(MODEL_PATH)
        self._scaler       = bundle["scaler"]
        self._feature_cols = bundle.get("feature_cols", list(FEATURE_LABELS.keys()))

        # Get base XGB estimator from the calibrated wrapper
        calibrated = bundle["calibrated"]
        base_clf   = (calibrated.estimator
                      if hasattr(calibrated, "estimator")
                      else calibrated.calibrated_classifiers_[0].estimator)
        self._explainer = shap.TreeExplainer(base_clf)

    def explain(self, tx_features: list, top_n: int = 4) -> list[str]:
        """
        Returns up to top_n human-readable reason strings for the prediction.
        E.g., ["High vendor risk score (0.87)", "Transaction at 02:00 (after hours)"]
        """
        if self._explainer is None or self._scaler is None:
            return []

        X = np.array(tx_features, dtype=float).reshape(1, -1)
        X_sc = self._scaler.transform(X)
        X_df = pd.DataFrame(X_sc, columns=self._feature_cols)

        shap_vals = self._explainer.shap_values(X_df)[0]  # shape (n_features,)
        # Positive SHAP = pushes toward fraud
        positive_idx = np.argsort(shap_vals)[::-1]  # sorted desc

        reasons = []
        raw_vals = dict(zip(self._feature_cols, tx_features))

        for idx in positive_idx[:top_n]:
            if shap_vals[idx] <= 0.001:
                break
            feature = self._feature_cols[idx]
            label   = FEATURE_LABELS.get(feature, feature)
            val     = raw_vals.get(feature, "?")
            reason  = _format_reason(feature, label, val, shap_vals[idx])
            if reason:
                reasons.append(reason)

        return reasons


def _format_reason(feature: str, label: str, value, shap_value: float) -> Optional[str]:
    """Format a feature into a user-friendly fraud reason string."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        return f"{label} flagged"

    if feature == "amount":
        return f"Large transaction amount: ${v:,.2f}"
    if feature == "vendor_risk_score":
        return f"High vendor risk score: {v:.2f}/1.00"
    if feature == "amount_vs_avg_ratio":
        return f"Amount is {v:.1f}x business average"
    if feature == "num_txns_last_1h":
        return f"{int(v)} transactions in past hour (unusual velocity)"
    if feature == "num_txns_last_24h":
        return f"{int(v)} transactions in past 24 hours (elevated activity)"
    if feature == "balance_drop_ratio":
        return f"Transaction drains {v*100:.0f}% of account balance"
    if feature == "is_after_hours" and v > 0.5:
        return "Transaction outside normal business hours"
    if feature == "is_crypto_category" and v > 0.5:
        return "Cryptocurrency payment detected"
    if feature == "high_risk_country" and v > 0.5:
        return "Vendor located in high-risk jurisdiction"
    if feature == "country_mismatch" and v > 0.5:
        return "IP country does not match vendor country"
    if feature == "is_new_vendor" and v > 0.5:
        return "Payment to new/unknown vendor"
    if feature == "round_amount" and v > 0.5:
        return "Suspiciously round transaction amount"
    if feature == "time_since_last_txn":
        seconds = int(v)
        if seconds < 60:
            return f"Only {seconds}s since last transaction (rapid-fire)"
    return f"{label}: {v:.2f} (elevated risk factor)"


# Singleton
_explainer_instance: Optional[FraudExplainer] = None


def get_explainer() -> FraudExplainer:
    global _explainer_instance
    if _explainer_instance is None:
        _explainer_instance = FraudExplainer()
    return _explainer_instance


def explain_transaction(tx_features: list, top_n: int = 4) -> list[str]:
    """Convenience wrapper — returns SHAP-based reason strings."""
    return get_explainer().explain(tx_features, top_n=top_n)
