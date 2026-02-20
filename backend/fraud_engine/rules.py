"""
FraudSense — Rule Engine (Layer 1)
8 configurable threshold-based rules. Each rule returns a FlagResult.
All thresholds are loaded from env vars so they can be tuned without redeployment.
"""

import os
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

HIGH_RISK_COUNTRIES = {"NG", "RU", "KP", "IR", "VE", "UA", "BY", "MM"}

# ── Configurable thresholds (env vars with sane defaults) ─────────────────────
CFG = {
    "large_txn_threshold":     float(os.getenv("RULE_LARGE_TXN",       "15000")),
    "velocity_1h_limit":       int(os.getenv("RULE_VELOCITY_1H",        "8")),
    "velocity_24h_limit":      int(os.getenv("RULE_VELOCITY_24H",       "30")),
    "round_amount_min":        float(os.getenv("RULE_ROUND_AMOUNT_MIN", "5000")),
    "vendor_risk_high":        float(os.getenv("RULE_VENDOR_RISK",      "0.65")),
    "ratio_spike":             float(os.getenv("RULE_RATIO_SPIKE",      "5.0")),
    "after_hours_start":       int(os.getenv("RULE_AFTER_HOURS_START",  "22")),
    "after_hours_end":         int(os.getenv("RULE_AFTER_HOURS_END",    "5")),
}


@dataclass
class FlagResult:
    rule_id:     str
    triggered:   bool
    severity:    str   # "low" | "medium" | "high" | "critical"
    message:     str
    score_delta: float = 0.0   # additive risk contribution (0–1)


def _flag(rule_id: str, severity: str, message: str, delta: float) -> FlagResult:
    return FlagResult(rule_id=rule_id, triggered=True,
                      severity=severity, message=message, score_delta=delta)


def _ok(rule_id: str) -> FlagResult:
    return FlagResult(rule_id=rule_id, triggered=False,
                      severity="none", message="", score_delta=0.0)


# ── Individual rules ──────────────────────────────────────────────────────────

def rule_large_transaction(tx: dict) -> FlagResult:
    """R1: Transaction amount unusually large."""
    amount  = float(tx.get("amount", 0) or 0)
    avg     = float(tx.get("business_avg_amount", amount) or amount)
    ratio   = amount / max(1.0, avg)
    limit   = CFG["large_txn_threshold"]

    if amount >= limit * 5:
        return _flag("R1", "critical", f"Amount ${amount:,.0f} is 5x+ above threshold", 0.35)
    if amount >= limit:
        return _flag("R1", "high", f"Amount ${amount:,.0f} exceeds ${limit:,.0f} threshold", 0.20)
    if ratio >= CFG["ratio_spike"]:
        return _flag("R1", "medium", f"Amount is {ratio:.1f}x business average", 0.12)
    return _ok("R1")


def rule_velocity_1h(tx: dict) -> FlagResult:
    """R2: Too many transactions in the past hour."""
    count = int(tx.get("num_txns_last_1h", 0) or 0)
    limit = CFG["velocity_1h_limit"]
    if count >= limit * 2:
        return _flag("R2", "critical", f"{count} transactions in past hour (limit: {limit})", 0.30)
    if count >= limit:
        return _flag("R2", "high", f"{count} transactions in past hour (limit: {limit})", 0.18)
    return _ok("R2")


def rule_velocity_24h(tx: dict) -> FlagResult:
    """R3: Too many transactions in the past 24 hours."""
    count = int(tx.get("num_txns_last_24h", 0) or 0)
    limit = CFG["velocity_24h_limit"]
    if count >= limit:
        return _flag("R3", "medium", f"{count} transactions in past 24h (limit: {limit})", 0.10)
    return _ok("R3")


def rule_high_risk_country(tx: dict) -> FlagResult:
    """R4: Vendor or transaction originates from high-risk jurisdiction."""
    vendor_country = str(tx.get("vendor_country", "") or "")
    ip_country     = str(tx.get("ip_country",     "") or "")

    if vendor_country in HIGH_RISK_COUNTRIES and ip_country in HIGH_RISK_COUNTRIES:
        return _flag("R4", "critical",
                     f"Both vendor ({vendor_country}) and IP ({ip_country}) in high-risk country",
                     0.35)
    if vendor_country in HIGH_RISK_COUNTRIES:
        return _flag("R4", "high", f"Vendor in high-risk country: {vendor_country}", 0.22)
    if ip_country in HIGH_RISK_COUNTRIES:
        return _flag("R4", "medium", f"Request IP from high-risk country: {ip_country}", 0.12)
    return _ok("R4")


def rule_country_mismatch(tx: dict) -> FlagResult:
    """R5: IP country doesn't match vendor country."""
    ip_country     = str(tx.get("ip_country",     "") or "")
    vendor_country = str(tx.get("vendor_country", "") or "")
    if ip_country and vendor_country and ip_country != vendor_country:
        return _flag("R5", "medium",
                     f"Country mismatch: IP={ip_country} vs vendor={vendor_country}", 0.10)
    return _ok("R5")


def rule_after_hours_crypto(tx: dict) -> FlagResult:
    """R6: Cryptocurrency purchase after business hours."""
    ts_raw   = tx.get("timestamp") or tx.get("date") or ""
    category = str(tx.get("category", "") or "").lower()
    payment  = str(tx.get("payment_method", "") or "").lower()
    is_crypto = "crypto" in category or "crypto" in payment

    hour = None
    try:
        hour = datetime.fromisoformat(str(ts_raw).replace("Z", "+00:00")).hour
    except Exception:
        hour = int(tx.get("hour_of_day", 12) or 12)

    after_hours = hour < CFG["after_hours_end"] or hour >= CFG["after_hours_start"]

    if is_crypto and after_hours:
        return _flag("R6", "high",
                     f"Crypto payment at {hour:02d}:00 (after hours)", 0.25)
    if is_crypto:
        return _flag("R6", "low", "Cryptocurrency payment detected", 0.05)
    if after_hours:
        return _flag("R6", "low", f"Transaction at {hour:02d}:00 (after hours)", 0.03)
    return _ok("R6")


def rule_round_amount_new_vendor(tx: dict) -> FlagResult:
    """R7: Suspiciously round amount to an unknown vendor."""
    amount     = float(tx.get("amount", 0) or 0)
    is_new     = bool(tx.get("is_new_vendor", 0))
    min_round  = CFG["round_amount_min"]
    is_round   = amount >= min_round and (amount % 1000 < 1 or amount % 500 < 1)

    if is_round and is_new:
        return _flag("R7", "high",
                     f"Round amount ${amount:,.0f} to new/unknown vendor", 0.22)
    if is_round:
        return _flag("R7", "low", f"Round amount: ${amount:,.0f}", 0.04)
    return _ok("R7")


def rule_vendor_risk_score(tx: dict) -> FlagResult:
    """R8: Vendor has a high risk score (from network analysis or blacklist)."""
    score = float(tx.get("vendor_risk_score", 0) or 0)
    limit = CFG["vendor_risk_high"]
    if score >= 0.90:
        return _flag("R8", "critical", f"Vendor risk score: {score:.2f} (critically high)", 0.35)
    if score >= limit:
        return _flag("R8", "high", f"Vendor risk score: {score:.2f}", 0.20)
    if score >= 0.40:
        return _flag("R8", "medium", f"Vendor risk score: {score:.2f} (elevated)", 0.08)
    return _ok("R8")


# ── Orchestrate all rules ─────────────────────────────────────────────────────
RULES = [
    rule_large_transaction,
    rule_velocity_1h,
    rule_velocity_24h,
    rule_high_risk_country,
    rule_country_mismatch,
    rule_after_hours_crypto,
    rule_round_amount_new_vendor,
    rule_vendor_risk_score,
]


def evaluate_rules(tx: dict) -> dict:
    """
    Run all rules and return:
    {
      "flags": [FlagResult, ...],          # only triggered rules
      "rule_score": float,                 # weighted sum (0–1)
      "critical_hit": bool,                # any critical rule fired
      "triggered_count": int,
    }
    """
    triggered = [r(tx) for r in RULES if r(tx).triggered]
    # Re-run without short-circuit to get all results
    all_results = [r(tx) for r in RULES]
    triggered   = [r for r in all_results if r.triggered]

    raw_score    = sum(r.score_delta for r in triggered)
    rule_score   = min(1.0, raw_score)
    critical_hit = any(r.severity == "critical" for r in triggered)

    return {
        "flags":           triggered,
        "rule_score":      round(rule_score, 4),
        "critical_hit":    critical_hit,
        "triggered_count": len(triggered),
    }
