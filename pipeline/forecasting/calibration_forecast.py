"""Per-household calibration forecaster module for GridVision (P2).

Trains a lightweight model on exactly ONE household's Calibration Window 1,
predicts that household's Calibration Window 2, and derives its calibration
residual distribution (Median AE, MAD, MAD-effective).

Locked Research Rules (Master Plan v4 §4.3/§8.5 & Blueprint v2 §C/§D.4):
- Per-household ONLY: Trained strictly on one household's own Cal-W1 data.
  Never pooled across households.
- Leakage isolation: Never receives or imports anything from global_forecaster.py.
  Runtime assertion enforces exactly 1 distinct household_id in training data.
- MAD floor:
  MAD_effective = max(calibration_mad, 0.05 * calibration_median_ae)
  Prevents standardized error explosion for near-zero variability meters.

Artifacts produced:
- data/artifacts/latest/calibration_residuals.parquet (Grain: 1 row per Cal-W2 half-hour slot)
- data/artifacts/latest/calibration_summary.parquet (Grain: 1 row per household)
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
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
MAD_FLOOR_FACTOR = 0.05


def build_window_feature_frame(
    half_hourly_readings: np.ndarray,
    dates: List[str],
    household_id: str,
    window_id: str,
) -> pd.DataFrame:
    """Construct feature matrix for a 56-day window (2,688 slots) for one household.
    
    Args:
        half_hourly_readings: 1D array of 2,688 half-hour consumption values.
        dates: List of 56 date strings (YYYY-MM-DD).
        household_id: Household identifier string.
        window_id: Calendar window ID.
        
    Returns:
        DataFrame with household_id, window_id, slot_index, calendar features, and actual load.
    """
    records: List[Dict[str, Any]] = []
    idx = 0
    for d_idx, d_str in enumerate(dates):
        dt = pd.to_datetime(d_str)
        dow = dt.dayofweek
        is_wknd = 1 if dow >= 5 else 0
        for hh_idx in range(48):
            records.append({
                "household_id": household_id,
                "window_id": window_id,
                "slot_index": idx,
                "day_index": d_idx,
                "half_hour": hh_idx,
                "day_of_week": dow,
                "is_weekend": is_wknd,
                "actual": float(half_hourly_readings[idx]),
            })
            idx += 1

    return pd.DataFrame(records)


def calibrate_household(
    household_id: str,
    cal_w1_df: pd.DataFrame,
    cal_w2_df: pd.DataFrame,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Train on household's own Cal-W1, predict Cal-W2, and compute residual distribution.
    
    Args:
        household_id: Expected household ID.
        cal_w1_df: Training DataFrame containing Cal-W1 readings for THIS household.
        cal_w2_df: Target DataFrame containing Cal-W2 readings for THIS household.
        random_state: Model random seed.
        
    Returns:
        Tuple of (residuals_df, summary_dict).
    """
    # Strict leakage assertion: exactly ONE household in training data
    unique_hhs = cal_w1_df["household_id"].unique()
    if len(unique_hhs) != 1 or unique_hhs[0] != household_id:
        raise ValueError(
            f"LEAKAGE VIOLATION: Calibration training data must contain exactly 1 household. "
            f"Expected {household_id}, found {unique_hhs}."
        )

    # Feature columns: half_hour of day, day_of_week, is_weekend
    features = ["half_hour", "day_of_week", "is_weekend"]
    X_train = cal_w1_df[features].values
    y_train = cal_w1_df["actual"].values

    X_test = cal_w2_df[features].values
    y_test = cal_w2_df["actual"].values

    # Train per-household lightweight gradient boosting regressor
    model = HistGradientBoostingRegressor(
        max_iter=50,
        learning_rate=0.1,
        random_state=random_state,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    preds = np.clip(preds, a_min=0.0, a_max=None)

    abs_residuals = np.abs(y_test - preds)
    cal_median_ae = float(np.median(abs_residuals))

    # Median Absolute Deviation from median AE: median(|e_i - median(e)|)
    cal_mad = float(np.median(np.abs(abs_residuals - cal_median_ae)))

    # MAD floor rule (v4 §8.5): stops standardized error from exploding if MAD is near zero
    mad_floor = MAD_FLOOR_FACTOR * cal_median_ae
    mad_effective = float(max(cal_mad, mad_floor, 1e-4))
    floor_triggered = bool(cal_mad < mad_floor or cal_mad < 1e-4)

    # Construct residuals dataframe
    residuals_df = cal_w2_df[["household_id", "window_id", "slot_index", "actual"]].copy()
    residuals_df["predicted"] = np.round(preds, 5)
    residuals_df["residual"] = np.round(abs_residuals, 5)

    summary = {
        "household_id": household_id,
        "calibration_median_ae": round(cal_median_ae, 5),
        "calibration_mad": round(cal_mad, 5),
        "mad_effective": round(mad_effective, 5),
        "mad_floor_triggered": floor_triggered,
    }

    return residuals_df, summary


def run_all_calibration_forecasts(
    calibration_assignment_df: Optional[pd.DataFrame] = None,
    interim_dir: Optional[Path] = None,
    output_dir: Optional[Path] = None,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Execute per-household calibration forecasting for all sampled households.
    
    Args:
        calibration_assignment_df: DataFrame with household_id, cal_w1, cal_w2.
        interim_dir: Directory containing block_*.parquet.
        output_dir: Directory to save calibration_residuals.parquet and calibration_summary.parquet.
        random_state: Random state for models.
        
    Returns:
        Tuple of (all_residuals_df, summary_df).
    """
    root = get_project_root()
    latest_artifacts = get_artifacts_dir("latest")

    if calibration_assignment_df is None:
        cal_path = latest_artifacts / "calibration_assignment.parquet"
        calibration_assignment_df = pd.read_parquet(cal_path)

    if interim_dir is None:
        interim_dir = root / "data" / "interim" / "blocks"
    else:
        interim_dir = Path(interim_dir)

    if output_dir is None:
        output_dir = latest_artifacts
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    windows = {w.id: w for w in get_calendar_windows()}
    flat_meta = get_flat_rate_metadata()
    hh_to_block = dict(zip(flat_meta["LCLid"], flat_meta["file"]))

    # Group households by interim block file to minimize disk reads
    block_groups: Dict[str, List[Dict[str, Any]]] = {}
    for _, row in calibration_assignment_df.iterrows():
        hh = str(row["household_id"])
        blk = hh_to_block.get(hh)
        if blk:
            block_groups.setdefault(blk, []).append({
                "household_id": hh,
                "cal_w1": str(row["calibration_window_1"]),
                "cal_w2": str(row["calibration_window_2"]),
            })

    total_hhs = len(calibration_assignment_df)
    logger.info(f"Running per-household calibration forecaster for {total_hhs} households...")

    all_residuals: List[pd.DataFrame] = []
    summaries: List[Dict[str, Any]] = []

    for blk_name, hhs in sorted(block_groups.items()):
        blk_path = interim_dir / f"{blk_name}.parquet"
        if not blk_path.exists():
            continue

        blk_df = pd.read_parquet(blk_path)

        for item in hhs:
            hh = item["household_id"]
            c1 = item["cal_w1"]
            c2 = item["cal_w2"]

            hh_data = blk_df[blk_df["LCLid"] == hh].set_index("day")[HH_COLS]

            # Extract interpolated 2,688 series for Cal-W1
            w1_obj = windows[c1]
            w1_dates = pd.date_range(w1_obj.start_date, w1_obj.end_date, freq="D").strftime("%Y-%m-%d").tolist()
            w1_raw = hh_data.reindex(w1_dates).values.flatten()
            w1_clean = pd.Series(w1_raw).interpolate().bfill().ffill().values

            cal_w1_df = build_window_feature_frame(w1_clean, w1_dates, household_id=hh, window_id=c1)

            # Extract interpolated 2,688 series for Cal-W2
            w2_obj = windows[c2]
            w2_dates = pd.date_range(w2_obj.start_date, w2_obj.end_date, freq="D").strftime("%Y-%m-%d").tolist()
            w2_raw = hh_data.reindex(w2_dates).values.flatten()
            w2_clean = pd.Series(w2_raw).interpolate().bfill().ffill().values

            cal_w2_df = build_window_feature_frame(w2_clean, w2_dates, household_id=hh, window_id=c2)

            res_df, summary = calibrate_household(
                household_id=hh,
                cal_w1_df=cal_w1_df,
                cal_w2_df=cal_w2_df,
                random_state=random_state,
            )

            all_residuals.append(res_df)
            summaries.append(summary)

    residuals_table = pd.concat(all_residuals, ignore_index=True)
    summary_table = pd.DataFrame(summaries).sort_values("household_id").reset_index(drop=True)

    # Save artifacts
    res_path = output_dir / "calibration_residuals.parquet"
    residuals_table.to_parquet(res_path, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Saved calibration_residuals.parquet to {res_path} ({len(residuals_table):,} rows)")

    sum_path = output_dir / "calibration_summary.parquet"
    summary_table.to_parquet(sum_path, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Saved calibration_summary.parquet to {sum_path} ({len(summary_table):,} rows)")

    return residuals_table, summary_table


run_calibration_forecaster = run_all_calibration_forecasts


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    run_all_calibration_forecasts()

