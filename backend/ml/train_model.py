"""
FraudSense — ML Training Pipeline (FINAL — Stratified + Calibration)
=====================================================================
Strategy:
  - Stratified random 70/15/15 split (correct for synthetic data)
  - Isotonic probability calibration on val set
  - F2 threshold tuning (recall-weighted: β=2)
  - 5-fold stratified CV (consistency check)
  - SHAP summary plot

Saves: fraud_pipeline.pkl, training_log.json, shap_summary.png
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from datetime import datetime, timezone

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedShuffleSplit, StratifiedKFold, cross_val_score
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    classification_report, roc_auc_score,
    precision_recall_curve, average_precision_score,
    f1_score, confusion_matrix
)
import xgboost as xgb
import shap

BASE_DIR  = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "fraud_dataset.csv")
MODEL_OUT = os.path.join(BASE_DIR, "..", "fraud_pipeline.pkl")
LOG_OUT   = os.path.join(BASE_DIR, "..", "training_log.json")
SHAP_OUT  = os.path.join(BASE_DIR, "..", "shap_summary.png")

FEATURE_COLS = [
    "amount", "hour_of_day", "day_of_week",
    "time_since_last_txn", "num_txns_last_1h", "num_txns_last_24h",
    "amount_vs_avg_ratio", "country_mismatch", "high_risk_country",
    "is_crypto_category", "is_new_vendor", "vendor_risk_score",
    "payment_method_encoded", "balance_drop_ratio", "round_amount",
    "is_after_hours",
]
LABEL_COL = "is_fraud"


def load_and_split(path):
    print(f"Loading {path}...")
    df = pd.read_csv(path)
    print(f"  Rows: {len(df):,} | Fraud rate: {df[LABEL_COL].mean()*100:.2f}%")

    X = df[FEATURE_COLS].copy()
    y = df[LABEL_COL].copy()

    X["amount"]              = X["amount"].clip(upper=X["amount"].quantile(0.999))
    X["time_since_last_txn"] = X["time_since_last_txn"].clip(upper=86_400)
    X["amount_vs_avg_ratio"] = X["amount_vs_avg_ratio"].clip(upper=50)
    X["num_txns_last_1h"]    = X["num_txns_last_1h"].clip(upper=50)

    sss1 = StratifiedShuffleSplit(n_splits=1, test_size=0.30, random_state=42)
    tr_i, tmp_i = next(sss1.split(X, y))

    sss2 = StratifiedShuffleSplit(n_splits=1, test_size=0.50, random_state=42)
    val_i, test_i = next(sss2.split(X.iloc[tmp_i], y.iloc[tmp_i]))

    X_train, y_train = X.iloc[tr_i],              y.iloc[tr_i]
    X_val,   y_val   = X.iloc[tmp_i].iloc[val_i], y.iloc[tmp_i].iloc[val_i]
    X_test,  y_test  = X.iloc[tmp_i].iloc[test_i],y.iloc[tmp_i].iloc[test_i]

    print(f"  Train: {len(X_train):,} | Val: {len(X_val):,} | Test: {len(X_test):,}")
    print(f"  Fraud → train: {y_train.mean()*100:.2f}%"
          f"  val: {y_val.mean()*100:.2f}%  test: {y_test.mean()*100:.2f}%")
    return X_train, X_val, X_test, y_train, y_val, y_test


def detect_device():
    try:
        t = xgb.XGBClassifier(device="cuda", n_estimators=1)
        t.fit(np.array([[1, 2]]), np.array([0]))
        print("  CUDA GPU detected.")
        return "cuda"
    except:
        print("  No GPU — CPU training.")
        return "cpu"


def run_cv(X_sc, y_train, device, spw):
    print("\n5-fold CV on training set...")
    clf = xgb.XGBClassifier(
        n_estimators=300, max_depth=7, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        scale_pos_weight=spw, device=device,
        tree_method="hist", random_state=42, verbosity=0,
    )
    skf    = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(clf, X_sc, y_train, cv=skf, scoring="roc_auc", n_jobs=-1)
    print(f"  CV ROC-AUC: {scores.mean():.4f} ± {scores.std():.4f}"
          f"  [{', '.join(f'{s:.4f}' for s in scores)}]")
    return scores


def tune_threshold(pred_fn, X_val, y_val, beta=2.0):
    probs = pred_fn(X_val)[:, 1]
    prec, rec, thresholds = precision_recall_curve(y_val, probs)
    b2     = beta ** 2
    fb     = (1 + b2) * prec * rec / np.maximum(b2 * prec + rec, 1e-9)
    idx    = int(np.argmax(fb[:-1]))
    t      = float(thresholds[idx])
    print(f"  Threshold (F{beta:.0f}): {t:.4f}  prec={prec[idx]:.3f}  recall={rec[idx]:.3f}")
    return t


def evaluate(pred_fn, X, y, t, label):
    probs = pred_fn(X)[:, 1]
    preds = (probs >= t).astype(int)
    roc   = roc_auc_score(y, probs)
    pr    = average_precision_score(y, probs)
    f1    = f1_score(y, preds)
    print(f"\n{'='*55}")
    print(f"  {label}  (thresh={t:.4f})")
    print(f"{'='*55}")
    print(f"  ROC-AUC: {roc:.4f}  PR-AUC: {pr:.4f}  F1: {f1:.4f}")
    print(f"  CM:\n{confusion_matrix(y, preds)}")
    print(classification_report(y, preds, target_names=["Legit", "Fraud"]))
    return {"roc_auc": round(roc, 4), "pr_auc": round(pr, 4), "f1": round(f1, 4)}


def shap_plot(scaler, clf, X_test):
    print("SHAP summary plot...")
    X_sc   = pd.DataFrame(scaler.transform(X_test), columns=FEATURE_COLS)
    sample = X_sc.sample(min(2000, len(X_sc)), random_state=42)
    exp    = shap.TreeExplainer(clf)
    vals   = exp.shap_values(sample)
    plt.figure(figsize=(12, 8))
    shap.summary_plot(vals, sample, feature_names=FEATURE_COLS, plot_type="bar", show=False)
    plt.title("FraudSense — Feature Importance (SHAP)", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(SHAP_OUT, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Saved → {SHAP_OUT}")


def train():
    print("\n" + "="*60)
    print("  FraudSense ML (stratified split + isotonic calibration)")
    print("="*60)

    X_train, X_val, X_test, y_train, y_val, y_test = load_and_split(DATA_PATH)

    neg, pos = (y_train == 0).sum(), (y_train == 1).sum()
    spw = round(float(neg / max(pos, 1)), 2)
    print(f"  Class weight: {spw}")

    device = detect_device()

    scaler     = StandardScaler()
    X_tr_sc    = scaler.fit_transform(X_train)
    X_val_sc   = scaler.transform(X_val)

    # CV
    cv_scores = run_cv(X_tr_sc, y_train, device, spw)

    # XGBoost with early stopping
    print("\nFitting XGBoost...")
    clf = xgb.XGBClassifier(
        n_estimators=700, max_depth=7, learning_rate=0.04,
        subsample=0.8, colsample_bytree=0.8,
        min_child_weight=5, gamma=0.2,
        reg_alpha=0.3, reg_lambda=2.0,
        scale_pos_weight=spw,
        device=device, tree_method="hist",
        eval_metric="aucpr", early_stopping_rounds=40,
        random_state=42, verbosity=1,
    )
    clf.fit(X_tr_sc, y_train, eval_set=[(X_val_sc, y_val)], verbose=50)

    # Isotonic calibration on val
    print("\nCalibrating...")
    calibrated = CalibratedClassifierCV(clf, cv="prefit", method="isotonic")
    calibrated.fit(X_val_sc, y_val)

    def pred_fn(X_df):
        return calibrated.predict_proba(scaler.transform(X_df))

    # Threshold tuning (F2)
    print("\nTuning threshold...")
    threshold = tune_threshold(pred_fn, X_val, y_val, beta=2.0)

    # Evaluate
    val_m  = evaluate(pred_fn, X_val,  y_val,  threshold, "Validation")
    test_m = evaluate(pred_fn, X_test, y_test, threshold, "Test (held-out)")

    # SHAP
    shap_plot(scaler, clf, X_test)

    # Save
    print(f"\nSaving → {MODEL_OUT}")
    joblib.dump({
        "scaler":       scaler,
        "calibrated":   calibrated,
        "threshold":    threshold,
        "feature_cols": FEATURE_COLS,
    }, MODEL_OUT)

    log = {
        "trained_at":  datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "model_path":  os.path.abspath(MODEL_OUT),
        "split":       "stratified random 70/15/15",
        "calibration": "isotonic (cv=prefit)",
        "cv_roc_auc":  {"mean": round(float(cv_scores.mean()), 4),
                        "std":  round(float(cv_scores.std()),  4)},
        "threshold":   threshold,
        "feature_cols": FEATURE_COLS,
        "val_metrics": val_m,
        "test_metrics": test_m,
    }
    with open(LOG_OUT, "w") as f:
        json.dump(log, f, indent=2)
    print(f"  Log → {LOG_OUT}")

    print("\n✅ Training complete!")
    print(f"   CV   ROC-AUC : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"   Val  ROC-AUC : {val_m['roc_auc']:.4f}  F1: {val_m['f1']:.4f}")
    print(f"   Test ROC-AUC : {test_m['roc_auc']:.4f}  F1: {test_m['f1']:.4f}")
    print(f"   Val↔Test gap : {abs(val_m['roc_auc'] - test_m['roc_auc']):.4f}")
    print(f"   Threshold    : {threshold:.4f}")


if __name__ == "__main__":
    train()
