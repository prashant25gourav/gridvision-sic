"""Isolation Forest anomaly detection module for GridVision (P3).

Detects behavioral anomalies across smart meter consumption features using
unsupervised Isolation Forest and attaches feature-based statistical explanations.

Locked Rules (Master Plan v4 §10 & Contract §3 / Blueprint v2 §C):
- Unsupervised anomaly detection across 8 behavioral features.
- Explanation is feature-based deviation (NOT SHAP).
- Produces:
    data/artifacts/latest/anomaly_flags.parquet
    Columns: household_id, window_id, window_role, is_anomaly, anomaly_score,
             triggering_statistic, value, baseline_mean, baseline_std, z_score, severity, explanation
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import logging
import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from pipeline.config import get_project_root, get_artifacts_dir
from pipeline.anomaly.explain import (
    BEHAVIORAL_FEATURE_COLS,
    compute_feature_baselines,
    explain_anomaly_row,
)

logger = logging.getLogger(__name__)


def fit_anomaly_detector(
    features_df: pd.DataFrame,
    contamination: float = 0.05,
    random_state: int = 42,
) -> IsolationForest:
    """Fit Isolation Forest model on behavioral feature matrix.
    
    Args:
        features_df: DataFrame containing the 8 behavioral features.
        contamination: Proportion of expected outliers.
        random_state: Model random seed.
        
    Returns:
        Fitted IsolationForest model.
    """
    # Deliberate choice: 0.05 reflects the nominal 5% tail anomaly budget in smart meter operational telemetry without requiring ground-truth labels.
    X = features_df[BEHAVIORAL_FEATURE_COLS].values
    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(X)
    return model


def detect_behavioral_anomalies(
    behavioral_features_df: Optional[pd.DataFrame] = None,
    output_dir: Optional[Path] = None,
    contamination: float = 0.05,
    random_state: int = 42,
) -> pd.DataFrame:
    """Run anomaly detection across all usable household-window behavioral feature records.
    
    Args:
        behavioral_features_df: DataFrame loaded from behavioral_features.parquet.
        output_dir: Destination path for anomaly_flags.parquet.
        contamination: Nominal outlier proportion (default 0.05).
        random_state: Model random seed.
        
    Returns:
        DataFrame containing anomaly flags, scores, and feature explanations.
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

    logger.info(f"Running Isolation Forest on {len(behavioral_features_df):,} feature observations...")

    # Fit Isolation Forest
    model = fit_anomaly_detector(
        features_df=behavioral_features_df,
        contamination=contamination,
        random_state=random_state,
    )

    X = behavioral_features_df[BEHAVIORAL_FEATURE_COLS].values
    # decision_function: lower / more negative = more anomalous
    scores = model.decision_function(X)
    preds = model.predict(X)
    is_anomaly_mask = preds == -1

    # Compute baseline feature distributions per household
    baselines = compute_feature_baselines(behavioral_features_df)

    # Attach explanations
    records: List[Dict[str, Any]] = []
    for idx, row in behavioral_features_df.iterrows():
        hh_id = str(row["household_id"])
        w_id = str(row["window_id"])
        w_role = str(row.get("window_role", "analysis"))
        score = float(scores[idx])
        is_anom = bool(is_anomaly_mask[idx])

        hh_base = baselines.get(hh_id, {})
        expl = explain_anomaly_row(row, hh_base, anomaly_score=score)

        record = {
            "household_id": hh_id,
            "window_id": w_id,
            "window_role": w_role,
            "is_anomaly": is_anom,
            "anomaly_score": round(score, 5),
            "triggering_statistic": expl["triggering_statistic"],
            "value": expl["value"],
            "baseline_mean": expl["baseline_mean"],
            "baseline_std": expl["baseline_std"],
            "z_score": expl["z_score"],
            "severity": expl["severity"] if is_anom else "normal",
            "explanation": expl["explanation"] if is_anom else "Within normal operating envelope.",
        }
        records.append(record)

    anomaly_flags_df = pd.DataFrame(records)

    # Sort deterministically
    anomaly_flags_df = anomaly_flags_df.sort_values(
        ["household_id", "window_id"]
    ).reset_index(drop=True)

    n_total = len(anomaly_flags_df)
    n_anom = int(anomaly_flags_df["is_anomaly"].sum())
    anom_pct = float(anomaly_flags_df["is_anomaly"].mean())

    logger.info(
        f"Anomaly Detection Complete:\n"
        f"  Total Evaluated: {n_total:,}\n"
        f"  Flagged Anomalies: {n_anom:,} ({anom_pct:.2%})\n"
        f"  Top Triggering Statistics: {anomaly_flags_df[anomaly_flags_df['is_anomaly']]['triggering_statistic'].value_counts().to_dict()}"
    )

    out_file = output_dir / "anomaly_flags.parquet"
    anomaly_flags_df.to_parquet(out_file, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Saved anomaly_flags.parquet to {out_file}")

    return anomaly_flags_df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    detect_behavioral_anomalies()
