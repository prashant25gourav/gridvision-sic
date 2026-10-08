"""Feature-based anomaly explanation module for GridVision.

Implements statistical deviation explanations for behavioral anomalies.

Architectural Rules:
- Scoped strictly to feature-based deviation (NOT SHAP).
  SHAP is reserved strictly for global forecaster explainability.
- Identifies the primary triggering statistic, baseline statistics,
  z-score deviation, severity level, and plain-language explanation.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


BEHAVIORAL_FEATURE_COLS = [
    "mean_load",
    "peak_load",
    "peak_to_average_ratio",
    "std_load",
    "ramp_rate_mean",
    "day_night_ratio",
    "weekday_weekend_contrast",
    "peak_timing",
]

FEATURE_LABELS = {
    "mean_load": "Mean Consumption (kW)",
    "peak_load": "Peak Load (kW)",
    "peak_to_average_ratio": "Peak-to-Average Ratio",
    "std_load": "Consumption Volatility (Std Dev)",
    "ramp_rate_mean": "Mean Ramp Rate",
    "day_night_ratio": "Day/Night Contrast Ratio",
    "weekday_weekend_contrast": "Weekday/Weekend Contrast",
    "peak_timing": "Peak Timing Slot",
}


def compute_feature_baselines(features_df: pd.DataFrame) -> Dict[str, Dict[str, Dict[str, float]]]:
    """Calculate per-household baseline mean and standard deviation for each feature.
    
    Args:
        features_df: Behavioral features DataFrame with household_id, window_id, and feature columns.
        
    Returns:
        Nested dict: household_id -> feature_name -> {"mean": float, "std": float}
    """
    baselines: Dict[str, Dict[str, Dict[str, float]]] = {}

    # Overall population fallback in case household has low sample variance
    pop_means = features_df[BEHAVIORAL_FEATURE_COLS].mean().to_dict()
    pop_stds = features_df[BEHAVIORAL_FEATURE_COLS].std().replace(0, 1.0).fillna(1.0).to_dict()

    grouped = features_df.groupby("household_id")
    for hh_id, group in grouped:
        hh_dict = {}
        for col in BEHAVIORAL_FEATURE_COLS:
            vals = group[col].dropna()
            m = float(vals.mean()) if len(vals) > 0 else float(pop_means[col])
            s = float(vals.std()) if len(vals) > 1 else float(pop_stds[col])
            if s <= 1e-4:
                s = max(float(pop_stds[col]), 0.05 * abs(m), 1e-3)
            hh_dict[col] = {"mean": m, "std": s}
        baselines[str(hh_id)] = hh_dict

    return baselines


def explain_anomaly_row(
    row: pd.Series,
    hh_baselines: Dict[str, Dict[str, float]],
    anomaly_score: float,
) -> Dict[str, Any]:
    """Generate a feature-based explanation for a single anomalous window observation.
    
    Args:
        row: Series containing behavioral feature values for an observation.
        hh_baselines: Baseline stats for the household: feature -> {"mean": float, "std": float}.
        anomaly_score: Continuous score from Isolation Forest (lower = more anomalous).
        
    Returns:
        Dict with triggering_statistic, value, baseline_mean, baseline_std, z_score, severity, explanation.
    """
    max_z = -1.0
    best_feat = "peak_load"
    best_val = float(row.get(best_feat, 0.0))
    best_m = float(hh_baselines.get(best_feat, {}).get("mean", 1.0))
    best_s = float(hh_baselines.get(best_feat, {}).get("std", 0.5))

    for col in BEHAVIORAL_FEATURE_COLS:
        if col not in row or col not in hh_baselines:
            continue
        val = float(row[col])
        m = hh_baselines[col]["mean"]
        s = hh_baselines[col]["std"]
        z = abs(val - m) / s
        if z > max_z:
            max_z = z
            best_feat = col
            best_val = val
            best_m = m
            best_s = s

    # Determine severity
    if max_z >= 3.5 or anomaly_score <= -0.15:
        severity = "high"
    elif max_z >= 2.0 or anomaly_score <= -0.08:
        severity = "medium"
    else:
        severity = "low"

    direction = "Elevated" if best_val > best_m else "Depressed"
    feat_name = FEATURE_LABELS.get(best_feat, best_feat)
    explanation = (
        f"{direction} {feat_name}: observed {best_val:.2f} vs household baseline "
        f"{best_m:.2f} ± {best_s:.2f} (|z| = {max_z:.2f}, score = {anomaly_score:.3f})."
    )

    return {
        "triggering_statistic": best_feat,
        "value": round(best_val, 4),
        "baseline_mean": round(best_m, 4),
        "baseline_std": round(best_s, 4),
        "z_score": round(max_z, 2),
        "severity": severity,
        "explanation": explanation,
    }
