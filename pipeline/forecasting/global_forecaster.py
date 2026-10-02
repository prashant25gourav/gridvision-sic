"""Global pooled forecaster module for GridVision (P2).

Trains a pooled gradient boosting forecaster per calendar window w across all sampled
households, and predicts half-hourly load for window w+1.

Locked Research Rules (Master Plan v4 §8.5 & Blueprint v2 §C.9/§C.11/§D.5):
- Research Sole Source: The global forecaster is the SOLE source of forecast errors (AE)
  that feed the research outcome variable (Extreme Failure).
- Strictly Prospective / No Future Leakage:
  When predicting calendar window w+1, the training set must strictly satisfy window <= w.
  Trained_up_to_window < target_window (Gate G5).
- Grain:
  data/artifacts/latest/forecast_global.parquet
  Grain: 1 row per (household_id, window_id, slot_index) for all predicted calendar windows.
  Columns: household_id, window_id, slot_index, day, half_hour, actual, predicted, trained_up_to_window
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
from pipeline.windows.calendar import get_calendar_windows, calendar_successor

logger = logging.getLogger(__name__)

HH_COLS = [f"hh_{i}" for i in range(48)]
FEATURE_COLS = ["half_hour", "day_of_week", "is_weekend", "mean_load", "peak_load", "std_load"]


def train_and_predict_window_transition(
    w_train: str,
    w_target: str,
    sampled_households: Set[str],
    eligibility_df: pd.DataFrame,
    behavioral_features_df: pd.DataFrame,
    interim_dir: Path,
    hh_to_block: Dict[str, str],
    windows_dict: Dict[str, Any],
    random_state: int = 42,
    readings_by_hh: Optional[Dict[str, pd.DataFrame]] = None,
) -> pd.DataFrame:
    """Train global model on window w_train and predict all half-hours of w_target.
    
    Args:
        w_train: Predictor calendar window ID (e.g. 'W01').
        w_target: Target calendar window ID (e.g. 'W02'). Must be calendar successor of w_train.
        sampled_households: Set of sampled household IDs.
        eligibility_df: Window eligibility DataFrame.
        behavioral_features_df: Behavioral features DataFrame.
        interim_dir: Path to directory containing block_*.parquet.
        hh_to_block: Dict mapping LCLid -> block name.
        windows_dict: Dict mapping window_id -> CalendarWindow object.
        random_state: Model random seed.
        readings_by_hh: Optional preloaded dict of household load readings (day indexed).
        
    Returns:
        DataFrame of half-hourly predictions for window w_target.
    """
    # Strict leakage assertion: w_train < w_target
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

    # For research outcome, households must have features at w_train to predict w_target
    active_hhs = sorted(list(train_eligible.intersection(target_eligible)))
    if not active_hhs:
        logger.warning(f"No common usable households for transition {w_train} -> {w_target}.")
        return pd.DataFrame()

    # Pre-index behavioral features for w_train
    w_train_feats = behavioral_features_df[
        (behavioral_features_df["window_id"] == w_train) &
        (behavioral_features_df["household_id"].isin(active_hhs))
    ].set_index("household_id")

    # Dates for w_train and w_target
    w_train_dates = pd.date_range(
        windows_dict[w_train].start_date, windows_dict[w_train].end_date, freq="D"
    ).strftime("%Y-%m-%d").tolist()

    w_target_dates = pd.date_range(
        windows_dict[w_target].start_date, windows_dict[w_target].end_date, freq="D"
    ).strftime("%Y-%m-%d").tolist()

    train_data_list = []
    test_data_list = []

    def _process_household(h: str, h_readings: pd.DataFrame):
        if h not in w_train_feats.index:
            return
        h_f = w_train_feats.loc[h]
        m_l = float(h_f["mean_load"])
        p_l = float(h_f["peak_load"])
        s_l = float(h_f["std_load"])

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
                    h, w_target, idx, d, hh, dow, is_wknd, m_l, p_l, s_l, target_clean[idx]
                ])
                idx += 1

    if readings_by_hh is not None:
        for h in active_hhs:
            if h in readings_by_hh:
                _process_household(h, readings_by_hh[h])
    else:
        # Group households by block file to minimize disk I/O
        block_map: Dict[str, List[str]] = {}
        for h in active_hhs:
            blk = hh_to_block.get(h)
            if blk:
                block_map.setdefault(blk, []).append(h)

        for blk_name, hhs in block_map.items():
            blk_path = interim_dir / f"{blk_name}.parquet"
            if not blk_path.exists():
                continue
            b_df = pd.read_parquet(blk_path)
            for h in hhs:
                h_readings = b_df[b_df["LCLid"] == h].set_index("day")[HH_COLS]
                _process_household(h, h_readings)

    if not train_data_list or not test_data_list:
        return pd.DataFrame()

    train_arr = np.array(train_data_list, dtype=float)
    X_train = train_arr[:, :6]
    y_train = train_arr[:, 6]

    test_df = pd.DataFrame(
        test_data_list,
        columns=[
            "household_id", "window_id", "slot_index", "day",
            "half_hour", "day_of_week", "is_weekend",
            "mean_load", "peak_load", "std_load", "actual"
        ]
    )

    # Subsample training data if exceptionally large to maintain <2s runtime per window
    if len(X_train) > 100000:
        rng = np.random.default_rng(random_state)
        sample_indices = rng.choice(len(X_train), size=100000, replace=False)
        X_train = X_train[sample_indices]
        y_train = y_train[sample_indices]

    # Train pooled gradient boosting regressor
    model = HistGradientBoostingRegressor(
        max_iter=40,
        learning_rate=0.1,
        random_state=random_state,
    )
    model.fit(X_train, y_train)

    preds = model.predict(test_df[FEATURE_COLS].values)
    preds = np.clip(preds, a_min=0.0, a_max=None)

    test_df["predicted"] = np.round(preds, 5)
    test_df["trained_up_to_window"] = w_train
    test_df["actual"] = test_df["actual"].astype(float).round(5)

    out_cols = [
        "household_id",
        "window_id",
        "slot_index",
        "day",
        "half_hour",
        "actual",
        "predicted",
        "trained_up_to_window",
    ]
    return test_df[out_cols]


def run_global_forecaster(
    sampled_households_df: Optional[pd.DataFrame] = None,
    eligibility_df: Optional[pd.DataFrame] = None,
    behavioral_features_df: Optional[pd.DataFrame] = None,
    interim_dir: Optional[Path] = None,
    output_dir: Optional[Path] = None,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Run global forecaster across all consecutive calendar window pairs.
    
    Args:
        sampled_households_df: Sampled households DataFrame.
        eligibility_df: Window eligibility DataFrame.
        behavioral_features_df: Behavioral features DataFrame.
        interim_dir: Directory containing block_*.parquet.
        output_dir: Destination path for forecast_global.parquet.
        random_state: Random state for model reproducibility.
        
    Returns:
        Tuple of (forecast_global_df, window_mean_ae_df).
    """
    root = get_project_root()
    latest_artifacts = get_artifacts_dir("latest")

    if sampled_households_df is None:
        sampled_households_df = pd.read_parquet(latest_artifacts / "households_sampled.parquet")

    if eligibility_df is None:
        eligibility_df = pd.read_parquet(latest_artifacts / "window_eligibility.parquet")

    if behavioral_features_df is None:
        behavioral_features_df = pd.read_parquet(latest_artifacts / "behavioral_features.parquet")

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

    # Preload readings for sampled households across blocks to avoid repeated disk reads
    block_map: Dict[str, List[str]] = {}
    for h in sampled_set:
        blk = hh_to_block.get(h)
        if blk:
            block_map.setdefault(blk, []).append(h)

    logger.info(f"Preloading readings for {len(sampled_set)} sampled households across {len(block_map)} blocks...")
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

    # Iterate through all 13 calendar transitions (W01->W02, W02->W03, ... W13->W14)
    for i in range(len(windows) - 1):
        w_train = windows[i].id
        w_target = windows[i + 1].id
        logger.info(f"Global Forecaster: Training on {w_train} -> Predicting {w_target}...")

        pred_df = train_and_predict_window_transition(
            w_train=w_train,
            w_target=w_target,
            sampled_households=sampled_set,
            eligibility_df=eligibility_df,
            behavioral_features_df=behavioral_features_df,
            interim_dir=interim_dir,
            hh_to_block=hh_to_block,
            windows_dict=windows_dict,
            random_state=random_state,
            readings_by_hh=readings_by_hh,
        )

        if not pred_df.empty:
            all_predictions.append(pred_df)

    forecast_global = pd.concat(all_predictions, ignore_index=True)
    forecast_global = forecast_global.sort_values(
        ["household_id", "window_id", "slot_index"]
    ).reset_index(drop=True)

    # Compute mean AE per household-window (consumed by research table)
    forecast_global["abs_error"] = np.abs(forecast_global["actual"] - forecast_global["predicted"])
    mean_ae_df = forecast_global.groupby(["household_id", "window_id", "trained_up_to_window"])["abs_error"].mean().reset_index(name="ae")
    mean_ae_df["ae"] = mean_ae_df["ae"].round(5)

    forecast_global = forecast_global.drop(columns=["abs_error"])

    # Save artifact
    out_file = output_dir / "forecast_global.parquet"
    forecast_global.to_parquet(out_file, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Saved forecast_global.parquet to {out_file} ({len(forecast_global):,} rows)")

    summary_file = output_dir / "forecast_global_summary.parquet"
    mean_ae_df.to_parquet(summary_file, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Saved forecast_global_summary.parquet to {summary_file} ({len(mean_ae_df):,} window evaluations)")

    return forecast_global, mean_ae_df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    run_global_forecaster()
