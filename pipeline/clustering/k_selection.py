"""K Selection module for GridVision clustering (P1).

Performs silhouette sweep (k=3..8) on behavioral features pooled across every
household's own calibration windows (Calibration Window 1 and 2).

Locked Research Rules (Master Plan v4 §8.3 & Blueprint v2 §D):
- Calibration windows ONLY: Features from Analysis or Holdout periods must NEVER
  be seen during K selection.
- Fixed globally: K is fixed once from calibration features and reused forward.
- Deterministic: Fixed random_state=42 and n_init=10.

Artifact produced:
- data/artifacts/latest/k_selection_results.json
"""

from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import json
import logging
import argparse
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

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


def run_k_selection_sweep(
    behavioral_features_df: Optional[pd.DataFrame] = None,
    calibration_assignment_df: Optional[pd.DataFrame] = None,
    k_min: int = 3,
    k_max: int = 8,
    random_state: int = 42,
    output_path: Optional[Path] = None,
) -> Tuple[int, Dict[str, Any]]:
    """Run silhouette sweep on pooled calibration-window features to select optimal K.
    
    Args:
        behavioral_features_df: DataFrame of behavioral features for usable windows.
        calibration_assignment_df: DataFrame mapping household to cal_w1 and cal_w2.
        k_min: Minimum clusters to test (default 3).
        k_max: Maximum clusters to test (default 8).
        random_state: Seed for KMeans reproducibility (default 42).
        output_path: Destination path for k_selection_results.json.
        
    Returns:
        Tuple of (selected_k, results_dict).
    """
    latest_artifacts = get_artifacts_dir("latest")

    if behavioral_features_df is None:
        bf_path = latest_artifacts / "behavioral_features.parquet"
        behavioral_features_df = pd.read_parquet(bf_path)

    if calibration_assignment_df is None:
        cal_path = latest_artifacts / "calibration_assignment.parquet"
        calibration_assignment_df = pd.read_parquet(cal_path)

    # Build calibration window set: (household_id, window_id)
    cal_pairs = set()
    for _, row in calibration_assignment_df.iterrows():
        hh = str(row["household_id"])
        cal_pairs.add((hh, str(row["calibration_window_1"])))
        cal_pairs.add((hh, str(row["calibration_window_2"])))

    # Strictly filter features to calibration pairs only
    df = behavioral_features_df.copy()
    df["pair_key"] = list(zip(df["household_id"].astype(str), df["window_id"].astype(str)))
    cal_features = df[df["pair_key"].isin(cal_pairs)].reset_index(drop=True)

    expected_cal_rows = len(calibration_assignment_df) * 2
    if len(cal_features) != expected_cal_rows:
        logger.warning(
            f"Expected {expected_cal_rows} calibration feature rows, found {len(cal_features)}. "
            f"Some households may have incomplete calibration feature rows."
        )

    # Standardize features
    X = cal_features[FEATURE_COLS].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    sweep_results: Dict[int, float] = {}
    inertias: Dict[int, float] = {}

    logger.info(f"Running silhouette sweep for K in [{k_min}, {k_max}] on {len(X)} calibration observations...")

    for k in range(k_min, k_max + 1):
        km = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        labels = km.fit_predict(X_scaled)
        sil_score = float(silhouette_score(X_scaled, labels))
        sweep_results[k] = round(sil_score, 4)
        inertias[k] = round(float(km.inertia_), 2)
        logger.info(f"  k={k}: silhouette={sil_score:.4f}, inertia={km.inertia_:.1f}")

    # Optimal K is the argmax of silhouette score
    optimal_k = max(sweep_results, key=lambda k: sweep_results[k])
    best_score = sweep_results[optimal_k]

    logger.info(f"Selected optimal K = {optimal_k} (silhouette = {best_score:.4f})")

    results = {
        "selected_k": optimal_k,
        "best_silhouette_score": best_score,
        "silhouette_sweep": {str(k): score for k, score in sweep_results.items()},
        "inertia_sweep": {str(k): inr for k, inr in inertias.items()},
        "calibration_samples_count": len(cal_features),
        "random_state": random_state,
        "feature_columns": FEATURE_COLS,
    }

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        logger.info(f"Saved k_selection_results.json to {output_path}")

    return optimal_k, results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    artifacts_dir = get_artifacts_dir("latest")
    out_file = artifacts_dir / "k_selection_results.json"
    k, res = run_k_selection_sweep(output_path=out_file)
    print(f"\nK selection complete: K={k}")
    print(json.dumps(res, indent=2))
