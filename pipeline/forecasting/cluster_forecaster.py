"""Per-cluster forecaster module for GridVision.

Trains a separate gradient boosting forecaster for each behavioral cluster
at calendar window w across all sampled households assigned to that cluster,
and predicts half-hourly load for window w+1.

Architecture Rules:
- Capstone Only: Per-cluster forecaster is strictly for the engineering dashboard/UI
  comparison against the global baseline forecaster.
- ZERO Research Contamination: NEVER feeds the research outcome variable (Extreme Failure).
- Static Isolation: pipeline/research/build_research_table.py must NEVER import this module.
- Grain:
  data/artifacts/latest/forecast_percluster.parquet
  Columns: household_id, window_id, slot_index, day, half_hour, actual, predicted, cluster_id, trained_up_to_window
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
import logging
import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

from pipeline.config import get_project_root, get_artifacts_dir
from pipeline.ingestion.metadata import get_flat_rate_metadata
from pipeline.windows.calendar import get_calendar_windows

logger = logging.getLogger(__name__)

HH_COLS = [f"hh_{i}" for i in range(48)]
FEATURE_COLS = ["half_hour", "day_of_week", "is_weekend", "mean_load", "peak_load", "std_load"]


def train_and_predict_cluster_transition(
    w_train: str,
    w_target: str,
    sampled_households: Set[str],
    eligibility_df: pd.DataFrame,
    behavioral_features_df: pd.DataFrame,
    cluster_assignments_df: pd.DataFrame,
    windows_dict: Dict[str, Any],
    readings_by_hh: Dict[str, pd.DataFrame],
    random_state: int = 42,
) -> pd.DataFrame:
    """Train cluster models on window w_train and predict half-hours of w_target.
    
    Args:
        w_train: Predictor calendar window ID.
        w_target: Target calendar window ID.
        sampled_households: Set of sampled household IDs.
        eligibility_df: Window eligibility DataFrame.
        behavioral_features_df: Behavioral features DataFrame.
        cluster_assignments_df: Cluster assignments DataFrame.
        windows_dict: Dict mapping window_id -> CalendarWindow object.
        readings_by_hh: Dict of preloaded household readings.
        random_state: Model random seed.
        
    Returns:
        DataFrame of per-cluster predictions for window w_target.
    """
    if w_train >= w_target:
        raise ValueError(
            f"LEAKAGE VIOLATION: trained_up_to_window ({w_train}) must be strictly less than "
            f"target_window ({w_target})."
        )

    # Eligible households in w_train and w_target
    train_eligible = set(eligibility_df[
        (eligibility_df["window_id"] == w_train) &
        (eligibility_df["is_usable"]) &
        (eligibility_df["household_id"].isin(sampled_households))
    ]["household_id"])

    target_eligible = set(eligibility_df[
        (eligibility_df["window_id"] == w_target) &
        (eligibility_df["is_usable"]) &
        (eligibility_df["household_id"].isin(sampled_households))
    ]["household_id"])

    active_hhs = sorted(list(train_eligible.intersection(target_eligible)))
    if not active_hhs:
        return pd.DataFrame()

    # Pre-index behavioral features and cluster assignments for w_train
    w_train_feats = behavioral_features_df[
        (behavioral_features_df["window_id"] == w_train) &
        (behavioral_features_df["household_id"].isin(active_hhs))
    ].set_index("household_id")

    cluster_col = "aligned_cluster_label" if "aligned_cluster_label" in cluster_assignments_df.columns else "cluster_id"
    w_train_clusters = cluster_assignments_df[
        (cluster_assignments_df["window_id"] == w_train) &
        (cluster_assignments_df["household_id"].isin(active_hhs))
    ].set_index("household_id")[cluster_col].to_dict()

    w_train_dates = pd.date_range(
        windows_dict[w_train].start_date, windows_dict[w_train].end_date, freq="D"
    ).strftime("%Y-%m-%d").tolist()

    w_target_dates = pd.date_range(
        windows_dict[w_target].start_date, windows_dict[w_target].end_date, freq="D"
    ).strftime("%Y-%m-%d").tolist()

    # Group households by their cluster at w_train
    cluster_groups: Dict[int, List[str]] = {}
    for h in active_hhs:
        c_id = w_train_clusters.get(h)
        if c_id is not None:
            cluster_groups.setdefault(int(c_id), []).append(h)

    transition_predictions: List[pd.DataFrame] = []

    for c_id, hhs in cluster_groups.items():
        train_data_list = []
        test_data_list = []

        for h in hhs:
            if h not in w_train_feats.index or h not in readings_by_hh:
                continue

            h_f = w_train_feats.loc[h]
            m_l = float(h_f["mean_load"])
            p_l = float(h_f["peak_load"])
            s_l = float(h_f["std_load"])

            h_readings = readings_by_hh[h]

            # 1. Training data from w_train
            train_raw = h_readings.reindex(w_train_dates).values.flatten()
            train_clean = pd.Series(train_raw).interpolate().bfill().ffill().values
            idx = 0
            for d in w_train_dates:
                dt = pd.to_datetime(d)
                dow = dt.dayofweek
                is_wknd = 1 if dow >= 5 else 0
                for hh in range(48):
                    train_data_list.append([hh, dow, is_wknd, m_l, p_l, s_l, train_clean[idx]])
                    idx += 1

            # 2. Test data from w_target
            target_raw = h_readings.reindex(w_target_dates).values.flatten()
            target_clean = pd.Series(target_raw).interpolate().bfill().ffill().values
            idx = 0
            for d in w_target_dates:
                dt = pd.to_datetime(d)
                dow = dt.dayofweek
                is_wknd = 1 if dow >= 5 else 0
                for hh in range(48):
                    test_data_list.append([
                        h, w_target, idx, d, hh, dow, is_wknd, m_l, p_l, s_l, target_clean[idx], c_id
                    ])
                    idx += 1

        if not train_data_list or not test_data_list:
            continue

        train_arr = np.array(train_data_list, dtype=float)
        X_train = train_arr[:, :6]
        y_train = train_arr[:, 6]

        test_df = pd.DataFrame(
            test_data_list,
            columns=[
                "household_id", "window_id", "slot_index", "day",
                "half_hour", "day_of_week", "is_weekend",
                "mean_load", "peak_load", "std_load", "actual", "cluster_id"
            ]
        )

        if len(X_train) > 50000:
            rng = np.random.default_rng(random_state)
            sample_indices = rng.choice(len(X_train), size=50000, replace=False)
            X_train = X_train[sample_indices]
            y_train = y_train[sample_indices]

        model = HistGradientBoostingRegressor(
            max_iter=30,
            learning_rate=0.1,
            random_state=random_state,
        )
        model.fit(X_train, y_train)

        preds = model.predict(test_df[FEATURE_COLS].values)
        preds = np.clip(preds, a_min=0.0, a_max=None)

        test_df["predicted"] = np.round(preds, 5)
        test_df["trained_up_to_window"] = w_train
        test_df["actual"] = test_df["actual"].astype(float).round(5)

        transition_predictions.append(test_df[[
            "household_id", "window_id", "slot_index", "day",
            "half_hour", "actual", "predicted", "cluster_id", "trained_up_to_window"
        ]])

    if not transition_predictions:
        return pd.DataFrame()

    return pd.concat(transition_predictions, ignore_index=True)


def run_cluster_forecaster(
    sampled_households_df: Optional[pd.DataFrame] = None,
    eligibility_df: Optional[pd.DataFrame] = None,
    behavioral_features_df: Optional[pd.DataFrame] = None,
    cluster_assignments_df: Optional[pd.DataFrame] = None,
    interim_dir: Optional[Path] = None,
    output_dir: Optional[Path] = None,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Run per-cluster forecaster across all consecutive calendar window pairs.
    
    Args:
        sampled_households_df: Sampled households DataFrame.
        eligibility_df: Window eligibility DataFrame.
        behavioral_features_df: Behavioral features DataFrame.
        cluster_assignments_df: Cluster assignments DataFrame.
        interim_dir: Directory containing block_*.parquet.
        output_dir: Destination path for forecast_percluster.parquet.
        random_state: Model random seed.
        
    Returns:
        Tuple of (forecast_percluster_df, summary_df).
    """
    root = get_project_root()
    latest_artifacts = get_artifacts_dir("latest")

    if sampled_households_df is None:
        sampled_households_df = pd.read_parquet(latest_artifacts / "households_sampled.parquet")

    if eligibility_df is None:
        eligibility_df = pd.read_parquet(latest_artifacts / "window_eligibility.parquet")

    if behavioral_features_df is None:
        behavioral_features_df = pd.read_parquet(latest_artifacts / "behavioral_features.parquet")

    if cluster_assignments_df is None:
        cluster_assignments_df = pd.read_parquet(latest_artifacts / "cluster_assignments.parquet")

    if interim_dir is None:
        interim_dir = root / "data" / "interim" / "blocks"
    else:
        interim_dir = Path(interim_dir)

    if output_dir is None:
        output_dir = latest_artifacts
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    sampled_set = set(sampled_households_df["household_id"])
    windows = get_calendar_windows()
    windows_dict = {w.id: w for w in windows}
    flat_meta = get_flat_rate_metadata()
    hh_to_block = dict(zip(flat_meta["LCLid"], flat_meta["file"]))

    # Preload readings for sampled households across blocks
    block_map: Dict[str, List[str]] = {}
    for h in sampled_set:
        blk = hh_to_block.get(h)
        if blk:
            block_map.setdefault(blk, []).append(h)

    logger.info(f"Per-Cluster Forecaster: Preloading readings for {len(sampled_set)} households...")
    readings_by_hh: Dict[str, pd.DataFrame] = {}
    for blk_name, hhs in block_map.items():
        blk_path = interim_dir / f"{blk_name}.parquet"
        if blk_path.exists():
            b_df = pd.read_parquet(blk_path)
            for h in hhs:
                sub = b_df[b_df["LCLid"] == h]
                if not sub.empty:
                    readings_by_hh[h] = sub.set_index("day")[HH_COLS]

    all_predictions: List[pd.DataFrame] = []

    for i in range(len(windows) - 1):
        w_train = windows[i].id
        w_target = windows[i + 1].id
        logger.info(f"Per-Cluster Forecaster: Training on {w_train} -> Predicting {w_target}...")

        pred_df = train_and_predict_cluster_transition(
            w_train=w_train,
            w_target=w_target,
            sampled_households=sampled_set,
            eligibility_df=eligibility_df,
            behavioral_features_df=behavioral_features_df,
            cluster_assignments_df=cluster_assignments_df,
            windows_dict=windows_dict,
            readings_by_hh=readings_by_hh,
            random_state=random_state,
        )

        if not pred_df.empty:
            all_predictions.append(pred_df)

    forecast_percluster = pd.concat(all_predictions, ignore_index=True)
    forecast_percluster = forecast_percluster.sort_values(
        ["household_id", "window_id", "slot_index"]
    ).reset_index(drop=True)

    # Compute mean AE summary
    forecast_percluster["abs_error"] = np.abs(forecast_percluster["actual"] - forecast_percluster["predicted"])
    summary_df = forecast_percluster.groupby(
        ["household_id", "window_id", "trained_up_to_window", "cluster_id"]
    )["abs_error"].mean().reset_index(name="ae")
    summary_df["ae"] = summary_df["ae"].round(5)

    forecast_percluster = forecast_percluster.drop(columns=["abs_error"])

    # Save artifacts
    out_file = output_dir / "forecast_percluster.parquet"
    forecast_percluster.to_parquet(out_file, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Saved forecast_percluster.parquet to {out_file} ({len(forecast_percluster):,} rows)")

    summary_file = output_dir / "forecast_percluster_summary.parquet"
    summary_df.to_parquet(summary_file, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Saved forecast_percluster_summary.parquet to {summary_file}")

    return forecast_percluster, summary_df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    run_cluster_forecaster()
