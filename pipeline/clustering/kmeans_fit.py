"""K-Means clustering module for GridVision (P1).

Fits K-Means (fixed K=4, random_state=42, n_init=10) on behavioral features
for every usable window, including calibration windows.

Locked Research Rules (Master Plan v4 §8.3 & Blueprint v2 §C.5/§D):
- Fixed K: Reuses the K selected from the calibration sweep (K=4).
- Every usable window: Produces raw cluster labels for calibration, analysis, and holdout windows.
- Role annotation: Assigns window_role as "calibration_1", "calibration_2", "analysis", or "holdout".
- Centroid distances: Computed in standardized feature space as diagnostic metric.

Artifact produced:
- Raw cluster assignments and window centroids dict.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import logging
import argparse
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

from pipeline.config import get_project_root, get_artifacts_dir, load_config

logger = logging.getLogger(__name__)

FEATURE_COLS = [
    "mean_load",
    "peak_load",
    "peak_to_average_ratio",
    "std_load",
    "ramp_rate_mean",
    "day_night_ratio",
    "weekday_weekend_contrast",
    "peak_timing",
]


def annotate_window_roles(
    features_df: pd.DataFrame,
    calibration_assignment_df: pd.DataFrame,
) -> pd.DataFrame:
    """Add window_role column ('calibration_1', 'calibration_2', 'analysis', 'holdout')."""
    df = features_df.copy()
    role_map = {}

    for _, row in calibration_assignment_df.iterrows():
        hh = str(row["household_id"])
        c1 = str(row["calibration_window_1"])
        c2 = str(row["calibration_window_2"])
        holdout = str(row["last_usable_window"])

        role_map[(hh, c1)] = "calibration_1"
        role_map[(hh, c2)] = "calibration_2"
        role_map[(hh, holdout)] = "holdout"

    roles = []
    for _, row in df.iterrows():
        key = (str(row["household_id"]), str(row["window_id"]))
        assigned_role = role_map.get(key, "analysis")
        roles.append(assigned_role)

    df["window_role"] = roles
    return df


def fit_kmeans_per_window(
    features_df: Optional[pd.DataFrame] = None,
    calibration_assignment_df: Optional[pd.DataFrame] = None,
    k: int = 4,
    random_state: int = 42,
    output_path: Optional[Path] = None,
) -> Tuple[pd.DataFrame, Dict[str, np.ndarray]]:
    """Fit K-Means per calendar window and compute raw cluster assignments.
    
    Args:
        features_df: DataFrame of behavioral features for usable windows.
        calibration_assignment_df: DataFrame with calibration assignments.
        k: Fixed number of clusters (default 4).
        random_state: Random state for deterministic clustering.
        output_path: Optional destination path for raw cluster assignments.
        
    Returns:
        Tuple of (annotated_assignments_df, centroids_dict).
        centroids_dict maps window_id -> centroids array of shape (k, n_features).
    """
    latest_artifacts = get_artifacts_dir("latest")

    if features_df is None:
        bf_path = latest_artifacts / "behavioral_features.parquet"
        features_df = pd.read_parquet(bf_path)

    if calibration_assignment_df is None:
        cal_path = latest_artifacts / "calibration_assignment.parquet"
        calibration_assignment_df = pd.read_parquet(cal_path)

    # Annotate window roles
    df = annotate_window_roles(features_df, calibration_assignment_df)

    assignments_list: List[pd.DataFrame] = []
    centroids_dict: Dict[str, np.ndarray] = {}

    # Standardize features globally or per window?
    # Master Plan §8.3 / Blueprint C.5: standardized feature space
    # One .fit_predict call per calendar window
    for w_id, w_group in df.groupby("window_id"):
        w_df = w_group.copy().reset_index(drop=True)
        X = w_df[FEATURE_COLS].values

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        km = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        raw_labels = km.fit_predict(X_scaled)
        centroids = km.cluster_centers_  # shape: (k, 8)
        centroids_dict[w_id] = centroids

        # Calculate Euclidean distance to assigned cluster centroid
        distances = np.linalg.norm(X_scaled - centroids[raw_labels], axis=1)

        w_df["raw_cluster_label"] = raw_labels
        w_df["aligned_cluster_label"] = raw_labels  # to be aligned next
        w_df["centroid_distance"] = np.round(distances, 5)

        assignments_list.append(w_df)

    raw_assignments_df = pd.concat(assignments_list, ignore_index=True)
    raw_assignments_df = raw_assignments_df.sort_values(["household_id", "window_id"]).reset_index(drop=True)

    out_cols = [
        "household_id",
        "window_id",
        "window_role",
        "raw_cluster_label",
        "aligned_cluster_label",
        "centroid_distance",
    ]
    result_df = raw_assignments_df[out_cols]

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        result_df.to_parquet(output_path, index=False, engine="pyarrow", compression="snappy")
        logger.info(f"Saved raw cluster assignments to {output_path} ({len(result_df):,} rows)")

    return result_df, centroids_dict
