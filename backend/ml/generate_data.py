"""
FraudSense — Synthetic Dataset Generator (FINAL v3 — Realistic Overlap)
========================================================================
Generates 100k transactions with REALISTIC feature-fraud correlations.

Design:
  - Shared base distribution for each feature (both fraud + legit share it)
  - Fraud gets a *nudge* in the suspicious direction (not a separate distribution)
  - This forces the model to learn COMBINATIONS of features, not single thresholds
  - Target ROC-AUC: ~0.96 (impressive for demo, but realistic overlap)

Fraud rate: ~15% | Features: 16 | Time: ~1s
"""

import numpy as np
import pandas as pd
import os

N_TRANSACTIONS = 100_000
FRAUD_RATE     = 0.15
N_BUSINESSES   = 500
RANDOM_SEED    = 42

PAYMENT_ENC = {"credit_card": 3, "debit_card": 2, "bank_transfer": 1,
               "crypto": 4, "cash": 0}
HIGH_RISK_CC = {"NG", "RU", "KP", "IR", "VE", "UA", "BY", "MM"}
SAFE_CC  = ["US", "UK", "DE", "JP", "CA", "AU", "FR", "SG"]
PAYMENTS = ["credit_card", "debit_card", "bank_transfer", "crypto", "cash"]
PAY_PROBS = np.array([0.45, 0.30, 0.15, 0.05, 0.05])
CATEGORIES = ["retail","food","travel","utilities","healthcare",
              "entertainment","crypto","wholesale","services","real_estate"]

def generate_dataset(output_path: str = "ml/fraud_dataset.csv"):
    import time
    t0  = time.time()
    n   = N_TRANSACTIONS
    rng = np.random.default_rng(RANDOM_SEED)
    print(f"Generating {n:,} transactions (v3 — sweet spot)...")

    # ── 1. Business profiles ──────────────────────────────────────────────────
    biz_weights = rng.zipf(1.5, N_BUSINESSES).astype(float)
    biz_weights /= biz_weights.sum()
    biz_ids     = rng.choice(N_BUSINESSES, size=n, p=biz_weights)
    biz_avg_amt = np.exp(np.random.default_rng(1).normal(7.0, 1.0, N_BUSINESSES))

    # ── 2. Base features — ALL transactions share same base distribution ───────
    base_amounts = np.exp(
        np.log(np.maximum(1, biz_avg_amt[biz_ids])) + rng.normal(0, 0.7, n)
    )

    biz_rate     = (biz_weights * n / N_BUSINESSES * 24).clip(1, 200)
    base_vel_1h  = rng.poisson(np.maximum(0.5, biz_rate[biz_ids] / 24)).clip(0, 40)
    base_vel_24h = rng.poisson(np.maximum(2,   biz_rate[biz_ids])).clip(0, 500)

    base_time_since = rng.exponential(3600 * 2, n).clip(30, 86400)
    base_balance    = base_amounts * rng.uniform(4, 12, n)
    base_vendor_risk = rng.beta(1.5, 7, n)

    base_high_risk   = (rng.random(n) < 0.06)
    base_mismatch    = (rng.random(n) < 0.08)
    base_crypto      = (rng.random(n) < 0.05)
    base_new_vendor  = (rng.random(n) < 0.08)
    base_hour        = rng.integers(0, 24, n)
    base_day         = rng.integers(0, 7, n)
    base_round       = (rng.random(n) < 0.03)

    # ── 3. Fraud indicator (15%) ──────────────────────────────────────────────
    is_fraud = (rng.random(n) < FRAUD_RATE)

    # ── 4. NUDGE fraud rows ──────────────────────────────────────────────────
    f = is_fraud.astype(float)   # 1.0 for fraud rows, 0.0 for legit

    # Amount: fraud tends larger
    amount_nudge = rng.lognormal(0.8, 0.5, n) * f
    amounts      = base_amounts * (1 + amount_nudge)

    # Velocity: fraud bursts
    vel_1h_spike = rng.poisson(4, n) * (f * (rng.random(n) < 0.60)).astype(int)
    vel_24h_spike= rng.poisson(15, n)* (f * (rng.random(n) < 0.55)).astype(int)
    num_1h       = (base_vel_1h  + vel_1h_spike).clip(0, 50)
    num_24h      = (base_vel_24h + vel_24h_spike).clip(0, 300)

    # Time since last: fraud faster (but not always)
    time_accel   = np.where(
        (f == 1) & (rng.random(n) < 0.55),
        rng.exponential(300, n),
        base_time_since
    )
    time_since   = time_accel.clip(10, 86400)

    # Balance drop: fraud drains more
    drain_factor = np.where(
        (f == 1) & (rng.random(n) < 0.60),
        rng.uniform(0.5, 0.99, n),
        rng.uniform(0.02, 0.30, n)
    )
    balance_drop = drain_factor.clip(0, 1)

    # Vendor risk
    vendor_risk  = np.where(
        (f == 1) & (rng.random(n) < 0.55),
        rng.beta(4, 3, n),
        base_vendor_risk
    )

    # Ratio
    ratio_mult   = np.where(
        (f == 1) & (rng.random(n) < 0.65),
        rng.lognormal(1.2, 0.6, n),
        np.ones(n)
    )
    biz_avg_map2 = pd.Series(amounts).groupby(biz_ids).transform("mean").values
    amount_ratio = (amounts / np.maximum(1, biz_avg_map2) * ratio_mult).clip(0.05, 50)

    # Categorical
    high_risk_country = (base_high_risk | ((f.astype(bool)) & (rng.random(n) < 0.35))).astype(int)
    country_mismatch  = (base_mismatch  | ((f.astype(bool)) & (rng.random(n) < 0.40))).astype(int)
    is_crypto         = (base_crypto    | ((f.astype(bool)) & (rng.random(n) < 0.25))).astype(int)
    is_new_vendor     = (base_new_vendor| ((f.astype(bool)) & (rng.random(n) < 0.35))).astype(int)
    round_amount      = (base_round     | ((f.astype(bool)) & (rng.random(n) < 0.30) & (amounts > 1000))).astype(int)

    hour         = np.where(
        (f == 1) & (rng.random(n) < 0.40),
        rng.choice([0,1,2,3,4,22,23], n),
        base_hour
    )
    is_after_hours = ((hour < 5) | (hour > 22)).astype(int)

    fraud_pay_probs = np.array([0.20, 0.15, 0.28, 0.27, 0.10])
    payment_enc  = np.where(
        (f.astype(bool)) & (rng.random(n) < 0.45),
        rng.choice(list(PAYMENT_ENC.values()), n, p=fraud_pay_probs),
        rng.choice(list(PAYMENT_ENC.values()), n, p=PAY_PROBS)
    )

    df = pd.DataFrame({
        "amount":               amounts.round(2),
        "hour_of_day":          hour,
        "day_of_week":          base_day,
        "time_since_last_txn":  time_since.round(1),
        "num_txns_last_1h":     num_1h,
        "num_txns_last_24h":    num_24h,
        "amount_vs_avg_ratio":  amount_ratio.round(4),
        "country_mismatch":     country_mismatch,
        "high_risk_country":    high_risk_country,
        "is_crypto_category":   is_crypto,
        "is_new_vendor":        is_new_vendor,
        "vendor_risk_score":    vendor_risk.round(4),
        "payment_method_encoded": payment_enc,
        "balance_drop_ratio":   balance_drop.round(4),
        "round_amount":         round_amount,
        "is_after_hours":       is_after_hours,
        "is_fraud":             is_fraud.astype(int),
    })

    print(f"  Rows: {len(df):,} | Fraud rate: {df['is_fraud'].mean()*100:.2f}%")
    corr = df.corr()["is_fraud"].drop("is_fraud").abs().sort_values(ascending=False)
    for feat, c in corr.head(6).items():
        print(f"    {feat:<28} |r|={c:.4f}")

    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"  Saved → {output_path}  ({time.time()-t0:.1f}s)")
    return df

if __name__ == "__main__":
    generate_dataset("ml/fraud_dataset.csv")
