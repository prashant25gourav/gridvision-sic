"""Extreme-failure threshold module for GridVision (P2).

Derives the fixed extreme-failure threshold strictly from the pooled calibration
standardized error distribution.

Locked Research Rules (Master Plan v4 §8.5 & Blueprint v2 §C/§D):
- Calibration ONLY: Threshold is fixed strictly from calibration residuals.
  Analysis or Holdout residuals must NEVER be seen or used to compute or tune this threshold.
- Acyclic dependency: Must be computed and fixed BEFORE research table outcomes are labeled.
  Precedes all downstream analysis and modeling.
- Percentiles:
  - Primary: 95th percentile of pooled calibration standardized errors.
  - Pre-specified fallback: 90th percentile (used only if realized event rate is too low).

Artifact produced:
- data/artifacts/latest/extreme_failure_threshold.json
"""

from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import json
import logging
import argparse
import numpy as np
import pandas as pd

from pipeline.config import get_project_root, get_artifacts_dir

logger = logging.getLogger(__name__)


def compute_calibration_standardized_errors(
    residuals_df: pd.DataFrame,
    summary_df: pd.DataFrame,
) -> np.ndarray:
    """Compute window-level standardized error for each household in Calibration Window 2.
    
    Formula (v4 §8.5):
      StdError = (AE_cal - calibration_median_ae) / mad_effective
      where AE_cal is the mean absolute error across all half-hourly slots of Cal-W2.
      
    Args:
        residuals_df: DataFrame of Cal-W2 residuals with household_id, actual, predicted, residual.
        summary_df: DataFrame with household_id, calibration_median_ae, mad_effective.
        
    Returns:
        1D numpy array of calibration standardized errors across all households.
    """
    # Compute mean AE per household across its Cal-W2 half-hours
    mean_ae_per_hh = residuals_df.groupby("household_id")["residual"].mean().reset_index(name="ae_cal")

    # Merge with household calibration summary
    merged = mean_ae_per_hh.merge(summary_df, on="household_id", how="inner")

    std_errors = (merged["ae_cal"] - merged["calibration_median_ae"]) / merged["mad_effective"]
    return std_errors.values


def derive_extreme_failure_threshold(
    residuals_df: Optional[pd.DataFrame] = None,
    summary_df: Optional[pd.DataFrame] = None,
    primary_percentile: float = 95.0,
    fallback_percentile: float = 90.0,
    output_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Calculate and fix the extreme-failure threshold from calibration residuals.
    
    Args:
        residuals_df: DataFrame of Cal-W2 residuals. If None, read from latest artifacts.
        summary_df: DataFrame of calibration summary. If None, read from latest artifacts.
        primary_percentile: Primary threshold percentile (default 95.0).
        fallback_percentile: Pre-specified fallback percentile (default 90.0).
        output_path: Destination path for extreme_failure_threshold.json.
        
    Returns:
        Dict matching Contract §3 schema.
    """
    latest_artifacts = get_artifacts_dir("latest")

    if residuals_df is None:
        res_file = latest_artifacts / "calibration_residuals.parquet"
        residuals_df = pd.read_parquet(res_file)

    if summary_df is None:
        sum_file = latest_artifacts / "calibration_summary.parquet"
        summary_df = pd.read_parquet(sum_file)

    std_errors = compute_calibration_standardized_errors(residuals_df, summary_df)
    n_cal = len(std_errors)

    p95 = float(np.percentile(std_errors, primary_percentile))
    p90 = float(np.percentile(std_errors, fallback_percentile))

    threshold_data = {
        "threshold_std_error_95th": round(p95, 5),
        "fallback_90th": round(p90, 5),
        "primary_percentile": primary_percentile,
        "fallback_percentile": fallback_percentile,
        "n_calibration_errors": n_cal,
        "calibration_std_error_mean": round(float(np.mean(std_errors)), 5),
        "calibration_std_error_std": round(float(np.std(std_errors)), 5),
        "calibration_std_error_min": round(float(np.min(std_errors)), 5),
        "calibration_std_error_max": round(float(np.max(std_errors)), 5),
        "description": "Fixed extreme-failure threshold derived strictly from pooled calibration standardized errors.",
    }

    logger.info(
        f"Derived extreme-failure threshold from N={n_cal} calibration observations: "
        f"95th percentile = {p95:.4f}, 90th percentile = {p90:.4f}"
    )

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(threshold_data, f, indent=2)
        logger.info(f"Saved extreme_failure_threshold.json to {output_path}")

    return threshold_data


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    artifacts_dir = get_artifacts_dir("latest")
    out_file = artifacts_dir / "extreme_failure_threshold.json"
    derive_extreme_failure_threshold(output_path=out_file)
