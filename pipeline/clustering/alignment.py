"""Hungarian algorithm cluster alignment module for GridVision (P1).

Chains cluster label alignment across a household's entire usable-window sequence,
starting from its own first calibration window (Calibration Window 1).

Locked Alignment Design (Master Plan v4 §8.4 & Blueprint v2 §C.5/§D.2):
- Household isolation: Alignment NEVER crosses households; each household's trajectory
  is aligned strictly against its own preceding usable window.
- Sequence starts at Calibration Window 1:
  - Step 0 (calibration_1): Keeps its raw label as its aligned label (nothing precedes it).
  - Step 1 (calibration_2): Aligned to calibration_1.
  - Step 2 (first Analysis window): Aligned to calibration_2.
  - Step i: Aligned to window i-1.
- Cost matrix: Euclidean distance between centroids of window i-1 (in aligned coordinates)
  and window i (in raw coordinates).
- Permutation: Solved via scipy.optimize.linear_sum_assignment (exact Hungarian matching).

Artifact produced:
- data/artifacts/latest/cluster_assignments.parquet
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import logging
import argparse
import numpy as np
import pandas as pd
from scipy.optimize import linear_sum_assignment

from pipeline.config import get_project_root, get_artifacts_dir

logger = logging.getLogger(__name__)


def align_household_trajectory(
    household_df: pd.DataFrame,
    centroids_by_window: Dict[str, np.ndarray],
) -> pd.DataFrame:
    """Align cluster labels across one household's usable sequence using Hungarian algorithm.
    
    Args:
        household_df: Ordered DataFrame for ONE household, containing all usable windows
                      including calibration pair, sorted chronologically.
        centroids_by_window: Dict mapping window_id -> cluster centroids matrix of shape (K, D).
        
    Returns:
        DataFrame with aligned_cluster_label updated.
    """
    df = household_df.copy().reset_index(drop=True)
    n_windows = len(df)
    if n_windows == 0:
        return df

    aligned_labels: List[int] = []

    # Step 0: calibration_1 keeps its raw label
    first_w_id = str(df.loc[0, "window_id"])
    first_raw = int(df.loc[0, "raw_cluster_label"])
    aligned_labels.append(first_raw)

    # Active aligned centroids: initially the raw centroids of the first window
    prev_centroids_aligned = centroids_by_window[first_w_id].copy()

    # Step 1..n: align window i to window i-1
    for i in range(1, n_windows):
        curr_w_id = str(df.loc[i, "window_id"])
        curr_raw = int(df.loc[i, "raw_cluster_label"])
        curr_centroids_raw = centroids_by_window[curr_w_id]

        # Cost matrix: Euclidean distance from aligned centroids of window i-1 to raw centroids of window i
        # cost[a, b] = || C_{prev}[a] - C_{curr}[b] ||
        cost_matrix = np.linalg.norm(
            prev_centroids_aligned[:, None, :] - curr_centroids_raw[None, :, :],
            axis=2,
        )

        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        # col_ind (raw label b in window i) maps to row_ind (aligned label a from window i-1)
        mapping = {int(b): int(a) for a, b in zip(row_ind, col_ind)}

        curr_aligned = mapping.get(curr_raw, curr_raw)
        aligned_labels.append(curr_aligned)

        # Update aligned centroids for window i:
        # Reorder curr_centroids so that index a has the centroid of raw cluster b mapped to a
        k_clusters = len(curr_centroids_raw)
        new_aligned_centroids = np.zeros_like(curr_centroids_raw)
        for a, b in zip(row_ind, col_ind):
            new_aligned_centroids[a] = curr_centroids_raw[b]

        prev_centroids_aligned = new_aligned_centroids

    df["aligned_cluster_label"] = aligned_labels
    return df


def align_all_cluster_assignments(
    raw_assignments_df: pd.DataFrame,
    centroids_by_window: Dict[str, np.ndarray],
    output_path: Optional[Path] = None,
) -> pd.DataFrame:
    """Run Hungarian alignment across all sampled households' usable trajectories.
    
    Args:
        raw_assignments_df: DataFrame of raw cluster assignments.
        centroids_by_window: Dict mapping window_id -> centroids matrix (K, D).
        output_path: Destination path for cluster_assignments.parquet.
        
    Returns:
        DataFrame of aligned cluster assignments.
    """
    logger.info(f"Aligning cluster trajectories for {raw_assignments_df['household_id'].nunique()} households...")

    aligned_dfs: List[pd.DataFrame] = []

    # Process each household strictly in isolation
    for hh_id, hh_group in raw_assignments_df.groupby("household_id"):
        # Sort chronologically by window_id (W01..W14)
        hh_sorted = hh_group.sort_values("window_id").reset_index(drop=True)
        aligned = align_household_trajectory(hh_sorted, centroids_by_window)
        aligned_dfs.append(aligned)

    all_aligned = pd.concat(aligned_dfs, ignore_index=True)
    all_aligned = all_aligned.sort_values(["household_id", "window_id"]).reset_index(drop=True)

    expected_cols = [
        "household_id",
        "window_id",
        "window_role",
        "raw_cluster_label",
        "aligned_cluster_label",
        "centroid_distance",
    ]
    all_aligned = all_aligned[expected_cols]

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        all_aligned.to_parquet(output_path, index=False, engine="pyarrow", compression="snappy")
        logger.info(f"Saved aligned cluster_assignments.parquet to {output_path} ({len(all_aligned):,} rows)")

    return all_aligned
