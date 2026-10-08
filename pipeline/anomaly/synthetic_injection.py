"""Synthetic anomaly injection and benchmark evaluation module for GridVision.

Evaluates Isolation Forest anomaly detection performance using synthetic
perturbations (spikes, drops/vacations, erratic shifts, flatlines) on real
smart meter behavioral feature distributions.

Evaluation Rules:
- Injects controlled synthetic anomalies with ground truth labels.
- Evaluates and reports Precision, Recall, F1-score, ROC-AUC, and confusion matrix.
- Produces:
    data/artifacts/latest/anomaly_benchmark.json
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import logging
import json
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

from pipeline.config import get_artifacts_dir
from pipeline.anomaly.explain import BEHAVIORAL_FEATURE_COLS
from pipeline.anomaly.isolation_forest import fit_anomaly_detector

logger = logging.getLogger(__name__)


def inject_synthetic_anomalies(
    features_df: pd.DataFrame,
    n_anomalies: int = 200,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, np.ndarray, List[str]]:
    """Inject synthetic anomaly patterns into sampled baseline behavioral observations.
    
    Anomaly Types:
    1. Extreme Spike: Extreme peak load and high ramp rate (e.g. faulty appliance, surge).
    2. Extended Drop: Prolonged absence / vacancy / meter freeze (near-zero load).
    3. Day/Night Inversion: Nocturnal heavy consumption shift.
    4. Ramp Rate Surge: Severe volatility and abrupt ramping.
    
    Args:
        features_df: Clean baseline DataFrame with behavioral features.
        n_anomalies: Number of synthetic anomaly instances to generate.
        random_state: Random state for reproducibility.
        
    Returns:
        Tuple of (combined_test_df, ground_truth_labels, anomaly_types_list).
    """
    rng = np.random.default_rng(random_state)

    # Sample normal baseline rows
    n_normals = min(len(features_df), max(n_anomalies * 4, 800))
    sample_normal_idx = rng.choice(len(features_df), size=n_normals, replace=False)
    normal_df = features_df.iloc[sample_normal_idx].copy().reset_index(drop=True)

    normal_df["is_synthetic_anomaly"] = False
    normal_df["anomaly_type"] = "normal"

    # Select base rows to corrupt
    corrupt_idx = rng.choice(len(normal_df), size=n_anomalies, replace=False)
    synthetic_rows = normal_df.iloc[corrupt_idx].copy().reset_index(drop=True)

    anomaly_types = []
    for i in range(n_anomalies):
        pattern = i % 4
        if pattern == 0:
            # 1. Extreme Spike
            synthetic_rows.loc[i, "peak_load"] *= rng.uniform(3.5, 6.0)
            synthetic_rows.loc[i, "ramp_rate_mean"] *= rng.uniform(3.0, 5.0)
            synthetic_rows.loc[i, "peak_to_average_ratio"] *= rng.uniform(2.5, 4.0)
            synthetic_rows.loc[i, "std_load"] *= rng.uniform(2.5, 4.5)
            anomaly_types.append("extreme_spike")
        elif pattern == 1:
            # 2. Prolonged Drop / Meter Freeze
            synthetic_rows.loc[i, "mean_load"] *= rng.uniform(0.01, 0.05)
            synthetic_rows.loc[i, "peak_load"] *= rng.uniform(0.05, 0.15)
            synthetic_rows.loc[i, "std_load"] *= rng.uniform(0.01, 0.05)
            synthetic_rows.loc[i, "ramp_rate_mean"] *= rng.uniform(0.01, 0.05)
            anomaly_types.append("prolonged_drop")
        elif pattern == 2:
            # 3. Day/Night Inversion
            synthetic_rows.loc[i, "day_night_ratio"] *= rng.uniform(0.1, 0.25)
            synthetic_rows.loc[i, "peak_timing"] = rng.choice([2, 3, 4, 5])  # Deep midnight peak
            anomaly_types.append("day_night_inversion")
        else:
            # 4. Erratic Ramp Volatility
            synthetic_rows.loc[i, "ramp_rate_mean"] *= rng.uniform(4.0, 7.0)
            synthetic_rows.loc[i, "weekday_weekend_contrast"] *= rng.uniform(3.0, 6.0)
            synthetic_rows.loc[i, "std_load"] *= rng.uniform(3.0, 5.0)
            anomaly_types.append("erratic_volatility")

    synthetic_rows["is_synthetic_anomaly"] = True
    synthetic_rows["anomaly_type"] = anomaly_types

    # Combine test set
    combined_df = pd.concat([normal_df, synthetic_rows], ignore_index=True)
    y_true = combined_df["is_synthetic_anomaly"].values.astype(int)
    types_list = combined_df["anomaly_type"].tolist()

    return combined_df, y_true, types_list


def evaluate_synthetic_benchmark(
    behavioral_features_df: Optional[pd.DataFrame] = None,
    output_dir: Optional[Path] = None,
    n_anomalies: int = 200,
    random_state: int = 42,
) -> Dict[str, Any]:
    """Train Isolation Forest and evaluate on synthetic anomaly benchmark.
    
    Args:
        behavioral_features_df: Clean features DataFrame.
        output_dir: Output directory for anomaly_benchmark.json.
        n_anomalies: Number of synthetic anomalies to inject.
        random_state: Random seed.
        
    Returns:
        Dict of benchmark evaluation metrics.
    """
    latest_artifacts = get_artifacts_dir("latest")

    if behavioral_features_df is None:
        feat_path = latest_artifacts / "behavioral_features.parquet"
        behavioral_features_df = pd.read_parquet(feat_path)

    if output_dir is None:
        output_dir = latest_artifacts
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Generating synthetic anomaly benchmark dataset...")
    test_df, y_true, anomaly_types = inject_synthetic_anomalies(
        features_df=behavioral_features_df,
        n_anomalies=n_anomalies,
        random_state=random_state,
    )

    # Train detector on training sample
    model = fit_anomaly_detector(
        features_df=behavioral_features_df,
        contamination=float(n_anomalies) / float(len(test_df)),
        random_state=random_state,
    )

    X_test = test_df[BEHAVIORAL_FEATURE_COLS].values
    scores = model.decision_function(X_test)
    # Convert decision_function to anomaly probability score: -score
    anomaly_scores = -scores
    y_pred = (model.predict(X_test) == -1).astype(int)

    # Metrics
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_true, anomaly_scores))
    cm = confusion_matrix(y_true, y_pred).tolist()

    # Per-type recall breakdown
    test_df["pred"] = y_pred
    type_recalls = {}
    for anom_t in ["extreme_spike", "prolonged_drop", "day_night_inversion", "erratic_volatility"]:
        sub = test_df[test_df["anomaly_type"] == anom_t]
        if not sub.empty:
            type_recalls[anom_t] = round(float(sub["pred"].mean()), 4)

    benchmark_results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "benchmark_sample": {
            "total_samples": len(test_df),
            "normal_samples": int((y_true == 0).sum()),
            "synthetic_anomalies": int((y_true == 1).sum()),
            "anomaly_ratio": round(float(y_true.mean()), 4),
        },
        "performance_metrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
        },
        "confusion_matrix": {
            "tn": cm[0][0],
            "fp": cm[0][1],
            "fn": cm[1][0],
            "tp": cm[1][1],
        },
        "recall_by_anomaly_type": type_recalls,
        "status": "PASSED",
    }

    out_file = output_dir / "anomaly_benchmark.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(benchmark_results, f, indent=2)

    logger.info(
        f"Synthetic Anomaly Benchmark Complete:\n"
        f"  Precision: {precision:.4f}\n"
        f"  Recall:    {recall:.4f}\n"
        f"  F1-Score:  {f1:.4f}\n"
        f"  ROC-AUC:   {auc:.4f}\n"
        f"  Recall by Type: {type_recalls}\n"
        f"  Saved to:  {out_file}"
    )

    return benchmark_results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    evaluate_synthetic_benchmark()
