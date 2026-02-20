"""
FraudSense — Fraud Engine Orchestrator
Runs all 4 layers and returns a unified FraudVerdict.
"""

from dataclasses import dataclass, field
from typing import Optional
from .rules    import evaluate_rules, FlagResult
from .network  import analyze_transaction_network


@dataclass
class FraudVerdict:
    is_fraud:        bool
    risk_level:      str      # "low" | "medium" | "high" | "critical"
    confidence:      float    # ML probability 0–1
    rule_score:      float    # Rule engine score 0–1
    network_score:   float    # Network analysis score 0–1
    final_score:     float    # Weighted composite 0–1
    flags:           list     # List of FlagResult (triggered rules)
    shap_reasons:    list     # SHAP text reasons
    critical_hit:    bool     # Any critical rule fired
    review_required: bool     # Flag for human review queue
    verdict_source:  str      # "ml" | "rules" | "combined"

    def to_dict(self) -> dict:
        return {
            "is_fraud":        self.is_fraud,
            "risk_level":      self.risk_level,
            "confidence":      self.confidence,
            "rule_score":      self.rule_score,
            "network_score":   self.network_score,
            "final_score":     self.final_score,
            "flags":           [
                {
                    "rule_id":   f.rule_id,
                    "severity":  f.severity,
                    "message":   f.message,
                    "score_delta": f.score_delta,
                }
                for f in self.flags
            ],
            "shap_reasons":    self.shap_reasons,
            "critical_hit":    self.critical_hit,
            "review_required": self.review_required,
            "verdict_source":  self.verdict_source,
        }


# Layer weights for composite score
WEIGHTS = {"ml": 0.50, "rules": 0.35, "network": 0.15}

# Thresholds
FRAUD_THRESHOLD    = 0.45   # composite score above which → is_fraud=True
REVIEW_THRESHOLD   = 0.30   # composite score above which → review_required=True


def analyze(tx: dict, business_id: int,
            business_avg_amount: float = 0.0) -> FraudVerdict:
    """
    Run all 4 fraud detection layers for a single transaction.

    Args:
        tx:                   Transaction dict (from CSV row or API request)
        business_id:          DB business ID for network graph
        business_avg_amount:  Business's historical average transaction (for rules)

    Returns:
        FraudVerdict
    """
    # Inject business context into tx for rules
    if business_avg_amount > 0:
        tx["business_avg_amount"] = business_avg_amount

    # ── Layer 1: Rules ─────────────────────────────────────────────────────────
    rule_result = evaluate_rules(tx)
    rule_score  = rule_result["rule_score"]
    critical    = rule_result["critical_hit"]
    flags       = rule_result["flags"]

    # ── Layer 2: ML Model ──────────────────────────────────────────────────────
    ml_confidence = 0.0
    try:
        from model import predict_fraud, _build_feature_vector
        ml_pred       = predict_fraud(tx)
        ml_confidence = ml_pred.get("confidence", 0.0)
        raw_features  = _build_feature_vector(tx)
    except Exception as e:
        print(f"[FraudEngine] ML layer error: {e}")
        raw_features = []

    # ── Layer 3: SHAP Explainer ────────────────────────────────────────────────
    shap_reasons = []
    try:
        from fraud_engine.explainer import explain_transaction
        if raw_features:
            shap_reasons = explain_transaction(raw_features, top_n=4)
    except Exception as e:
        print(f"[FraudEngine] SHAP explainer error: {e}")

    # ── Layer 4: Network Analysis ──────────────────────────────────────────────
    network_score = 0.0
    try:
        net_result    = analyze_transaction_network(tx, business_id)
        network_score = net_result.get("network_risk_score", 0.0)
        # Update tx vendor_risk_score from network analysis
        vendor_risk   = net_result.get("vendor_risk_score", 0.0)
        if vendor_risk > tx.get("vendor_risk_score", 0.0):
            tx["vendor_risk_score"] = vendor_risk

        # Collusion → extra flag
        if net_result.get("collusion_detected"):
            from fraud_engine.rules import FlagResult
            flags.append(FlagResult(
                rule_id="NET1", triggered=True, severity="high",
                message=net_result["collusion"].get("message", "Collusion pattern detected"),
                score_delta=0.25,
            ))
    except Exception as e:
        print(f"[FraudEngine] Network layer error: {e}")

    # ── Composite Score ────────────────────────────────────────────────────────
    final_score = (
        WEIGHTS["ml"]      * ml_confidence +
        WEIGHTS["rules"]   * rule_score +
        WEIGHTS["network"] * network_score
    )

    # Critical rule → override to fraud regardless of score
    if critical:
        final_score = max(final_score, 0.75)

    final_score = round(min(1.0, final_score), 4)

    # ── Verdict ────────────────────────────────────────────────────────────────
    is_fraud = final_score >= FRAUD_THRESHOLD or critical

    if final_score >= 0.80 or critical:
        risk_level = "critical"
    elif final_score >= 0.60:
        risk_level = "high"
    elif final_score >= 0.35:
        risk_level = "medium"
    else:
        risk_level = "low"

    review_required = final_score >= REVIEW_THRESHOLD

    # Determine primary verdict source
    if critical:
        verdict_source = "rules"
    elif ml_confidence > 0 and ml_confidence > rule_score:
        verdict_source = "ml"
    elif rule_score > 0:
        verdict_source = "combined"
    else:
        verdict_source = "ml"

    return FraudVerdict(
        is_fraud=is_fraud,
        risk_level=risk_level,
        confidence=round(ml_confidence, 4),
        rule_score=round(rule_score, 4),
        network_score=round(network_score, 4),
        final_score=final_score,
        flags=flags,
        shap_reasons=shap_reasons,
        critical_hit=critical,
        review_required=review_required,
        verdict_source=verdict_source,
    )
