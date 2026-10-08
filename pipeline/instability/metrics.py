"""Instability and volatility metrics module for GridVision.

Calculates persistence, behavioral instability, and consumption volatility (CV)
for Analysis windows.

Metric Formulations:
- Grain: Analysis windows ONLY. Calibration windows and Holdout windows do not
  produce rows in this table.
- Transition counting:
  - Starts at Calibration Window 1 -> Calibration Window 2.
  - The first Analysis-window row has n_transitions_observed == 2 (Cal1->Cal2, Cal2->Analysis1).
  - Persistence(h, w) = 1.0 - (n_cluster_changes / n_transitions_observed)
  - Instability(h, w) = 1.0 - Persistence(h, w) = n_cluster_changes / n_transitions_observed
- Volatility:
  - Coefficient of variation (CV = std / mean) of household load across its usable
    windows from Calibration Window 1 through window w (strictly past/present, no leakage).

Artifact produced:
- data/artifacts/latest/instability_volatility.parquet
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import logging
import argparse
import numpy as np
import pandas as pd

from pipeline.config import get_project_root, get_artifacts_dir

logger = logging.getLogger(__name__)

EPSILON = 1e-6


def compute_instability_and_volatility(
    cluster_assignments_df: Optional[pd.DataFrame] = None,
    behavioral_features_df: Optional[pd.DataFrame] = None,
    output_path: Optional[Path] = None,
) -> pd.DataFrame:
    """Compute instability and volatility for all sampled households' Analysis windows.
    
    Args:
        cluster_assignments_df: DataFrame with aligned_cluster_label and window_role.
        behavioral_features_df: DataFrame with mean_load and std_load.
        output_path: Destination path for instability_volatility.parquet.
        
    Returns:
        DataFrame containing instability and volatility metrics for Analysis windows.
    """
    latest_artifacts = get_artifacts_dir("latest")

    if cluster_assignments_df is None:
        ca_path = latest_artifacts / "cluster_assignments.parquet"
        cluster_assignments_df = pd.read_parquet(ca_path)

    if behavioral_features_df is None:
        bf_path = latest_artifacts / "behavioral_features.parquet"
        behavioral_features_df = pd.read_parquet(bf_path)

    # Join cluster assignments with mean_load and std_load
    merged = cluster_assignments_df.merge(
        behavioral_features_df[["household_id", "window_id", "mean_load", "std_load"]],
        on=["household_id", "window_id"],
        how="inner",
    )

    records: List[Dict[str, Any]] = []

    # Process each household in chronological order across its full usable sequence
    for hh_id, group in merged.groupby("household_id"):
        group_sorted = group.sort_values("window_id").reset_index(drop=True)

        n_transitions = 0
        n_changes = 0
        means_history: List[float] = []
        stds_history: List[float] = []

        for i, row in group_sorted.iterrows():
            curr_label = int(row["aligned_cluster_label"])
            curr_role = str(row["window_role"])
            w_id = str(row["window_id"])
            m_l = float(row["mean_load"])
            s_l = float(row["std_load"])

            means_history.append(m_l)
            stds_history.append(s_l)

            if i > 0:
                prev_label = int(group_sorted.loc[i - 1, "aligned_cluster_label"])
                n_transitions += 1
                if curr_label != prev_label:
                    n_changes += 1

            # Only ANALYSIS windows get an output row
            if curr_role == "analysis":
                persistence = round(1.0 - (float(n_changes) / float(n_transitions)), 5)
                instability = round(float(n_changes) / float(n_transitions), 5)

                # Pooled CV across all usable windows from Cal-W1 up to w
                m_arr = np.array(means_history)
                s_arr = np.array(stds_history)
                overall_mean = float(np.mean(m_arr))
                # Pooled variance formula across equal-length (2688 slots) windows:
                overall_var = float(np.mean(s_arr**2) + np.mean((m_arr - overall_mean)**2))
                overall_std = float(np.sqrt(max(0.0, overall_var)))
                volatility_cv = round(overall_std / (overall_mean + EPSILON), 5)

                records.append({
                    "household_id": str(hh_id),
                    "window_id": w_id,
                    "n_transitions_observed": n_transitions,
                    "n_cluster_changes": n_changes,
                    "persistence": persistence,
                    "instability": instability,
                    "volatility_cv": volatility_cv,
                })

    metrics_df = pd.DataFrame(records)
    metrics_df = metrics_df.sort_values(["household_id", "window_id"]).reset_index(drop=True)

    expected_cols = [
        "household_id",
        "window_id",
        "n_transitions_observed",
        "n_cluster_changes",
        "persistence",
        "instability",
        "volatility_cv",
    ]
    metrics_df = metrics_df[expected_cols]

    # Validate contracts: no NaNs
    nan_count = metrics_df.isnull().sum().sum()
    if nan_count > 0:
        raise ValueError(f"Found {nan_count} NaNs in instability_volatility metrics!")

    # Validate first Analysis window transition count is 2
    first_rows = metrics_df.groupby("household_id").first()
    if not (first_rows["n_transitions_observed"] == 2).all():
        violators = first_rows[first_rows["n_transitions_observed"] != 2]
        raise ValueError(f"First Analysis window must have n_transitions_observed == 2! Violators:\n{violators}")

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        metrics_df.to_parquet(output_path, index=False, engine="pyarrow", compression="snappy")
        logger.info(f"Saved instability_volatility.parquet to {output_path} ({len(metrics_df):,} rows)")

    return metrics_df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    artifacts_dir = get_artifacts_dir("latest")
    out_file = artifacts_dir / "instability_volatility.parquet"
    df = compute_instability_and_volatility(output_path=out_file)
    print(f"\nDone. Computed {len(df):,} Analysis window rows.")
    print(df.head(5))
