"""Behavioral feature extraction module for GridVision (P1).

Extracts 8 load-curve behavioral features per household per usable window:
1. mean_load: Mean consumption (kWh) over the 56-day window
2. peak_load: Maximum consumption in any half-hour slot
3. peak_to_average_ratio: peak_load / mean_load
4. std_load: Standard deviation of half-hourly consumption
5. ramp_rate_mean: Mean absolute difference between consecutive half-hour readings
6. day_night_ratio: Mean daytime (06:00-22:00) vs nighttime (22:00-06:00) ratio
7. weekday_weekend_contrast: Normalized contrast between weekday and weekend mean load
8. peak_timing: Average half-hour slot index (0..47) of the daily maximum load

Scope:
- Runs on EVERY usable window for every sampled household, INCLUDING both calibration windows.
- Does NOT look across window boundaries (computed strictly from that window's own readings).

Artifact produced:
- data/artifacts/latest/behavioral_features.parquet
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import logging
import argparse
import numpy as np
import pandas as pd

from pipeline.config import get_project_root, get_artifacts_dir
from pipeline.ingestion.metadata import get_flat_rate_metadata
from pipeline.windows.calendar import get_calendar_windows

logger = logging.getLogger(__name__)

HH_COLS = [f"hh_{i}" for i in range(48)]
DAY_SLOTS = list(range(12, 44))  # 06:00 to 22:00 (slots 12 to 43 inclusive, 32 half-hours)
NIGHT_SLOTS = list(range(0, 12)) + list(range(44, 48))  # 22:00 to 06:00 (16 half-hours)
EPSILON = 1e-6


def extract_features_from_window_readings(
    window_matrix: np.ndarray,
    weekday_mask: np.ndarray,
) -> Dict[str, float]:
    """Compute the 8 behavioral features from a 56-day x 48-slot readings matrix.
    
    Args:
        window_matrix: 2D array of shape (56, 48) containing half-hour consumption.
        weekday_mask: 1D boolean array of length 56 (True for Mon-Fri, False for Sat-Sun).
        
    Returns:
        Dict mapping feature names to float values (no NaNs).
    """
    # Continuous 1D series across the 2,688 half-hours
    flat = window_matrix.flatten()
    s = pd.Series(flat).interpolate(method="linear").bfill().ffill().values

    # Reshape back to clean (56, 48)
    clean_mat = s.reshape(window_matrix.shape)

    # 1. mean_load
    mean_load = float(np.mean(clean_mat))

    # 2. peak_load
    peak_load = float(np.max(clean_mat))

    # 3. peak_to_average_ratio
    peak_to_average = float(peak_load / (mean_load + EPSILON))

    # 4. std_load
    std_load = float(np.std(clean_mat))

    # 5. ramp_rate_mean
    ramp_rate = float(np.mean(np.abs(np.diff(s))))

    # 6. day_night_ratio
    day_mean = float(np.mean(clean_mat[:, DAY_SLOTS]))
    night_mean = float(np.mean(clean_mat[:, NIGHT_SLOTS]))
    day_night_ratio = float(day_mean / (night_mean + EPSILON))

    # 7. weekday_weekend_contrast
    n_weekdays = int(np.sum(weekday_mask))
    n_weekends = int(np.sum(~weekday_mask))
    weekday_mean = float(np.mean(clean_mat[weekday_mask, :])) if n_weekdays > 0 else mean_load
    weekend_mean = float(np.mean(clean_mat[~weekday_mask, :])) if n_weekends > 0 else mean_load
    weekday_weekend_contrast = float((weekday_mean - weekend_mean) / (mean_load + EPSILON))

    # 8. peak_timing (average slot index 0..47 of daily peak)
    daily_peaks = np.argmax(clean_mat, axis=1)
    peak_timing = float(np.mean(daily_peaks))

    return {
        "mean_load": round(mean_load, 5),
        "peak_load": round(peak_load, 5),
        "peak_to_average_ratio": round(peak_to_average, 5),
        "std_load": round(std_load, 5),
        "ramp_rate_mean": round(ramp_rate, 5),
        "day_night_ratio": round(day_night_ratio, 5),
        "weekday_weekend_contrast": round(weekday_weekend_contrast, 5),
        "peak_timing": round(peak_timing, 3),
    }


def compute_behavioral_features(
    sampled_households_df: Optional[pd.DataFrame] = None,
    eligibility_df: Optional[pd.DataFrame] = None,
    interim_dir: Optional[Path] = None,
    output_path: Optional[Path] = None,
) -> pd.DataFrame:
    """Compute behavioral features for all sampled households across all usable windows.
    
    Args:
        sampled_households_df: DataFrame with household_id of sampled households.
        eligibility_df: DataFrame with household_id, window_id, is_usable.
        interim_dir: Path to directory containing block_*.parquet.
        output_path: Optional destination path for behavioral_features.parquet.
        
    Returns:
        DataFrame of behavioral features.
    """
    root = get_project_root()
    latest_artifacts = get_artifacts_dir("latest")

    if sampled_households_df is None:
        sample_file = latest_artifacts / "households_sampled.parquet"
        sampled_households_df = pd.read_parquet(sample_file)

    if eligibility_df is None:
        elig_file = latest_artifacts / "window_eligibility.parquet"
        eligibility_df = pd.read_parquet(elig_file)

    if interim_dir is None:
        interim_dir = root / "data" / "interim" / "blocks"
    else:
        interim_dir = Path(interim_dir)

    # Filter eligibility to sampled households and usable windows
    sampled_ids = set(sampled_households_df["household_id"])
    usable_windows = eligibility_df[
        eligibility_df["household_id"].isin(sampled_ids) & eligibility_df["is_usable"]
    ].copy()

    # Pre-build calendar window date ranges & weekday masks
    windows = get_calendar_windows()
    window_data: Dict[str, Dict[str, Any]] = {}
    for w in windows:
        dates = pd.date_range(w.start_date, w.end_date, freq="D")
        date_strs = dates.strftime("%Y-%m-%d").tolist()
        weekday_mask = dates.dayofweek < 5  # Mon-Fri = True
        window_data[w.id] = {
            "date_strs": date_strs,
            "weekday_mask": weekday_mask,
        }

    # Map each sampled household to its interim block file
    flat_meta = get_flat_rate_metadata()
    hh_to_block = dict(zip(flat_meta["LCLid"], flat_meta["file"]))

    # Group sampled households by block file to minimize disk I/O
    block_to_sampled_hhs: Dict[str, List[str]] = {}
    for h in sampled_ids:
        blk = hh_to_block.get(h)
        if blk:
            block_to_sampled_hhs.setdefault(blk, []).append(h)

    # Pre-group usable windows by household
    hh_usable_map: Dict[str, Set[str]] = {}
    for h, group in usable_windows.groupby("household_id"):
        hh_usable_map[h] = set(group["window_id"])

    logger.info(
        f"Extracting behavioral features for {len(sampled_ids)} households across "
        f"{len(block_to_sampled_hhs)} blocks ({len(usable_windows)} total household-windows)..."
    )

    records: List[Dict[str, Any]] = []

    for blk_name, hhs in sorted(block_to_sampled_hhs.items()):
        blk_path = interim_dir / f"{blk_name}.parquet"
        if not blk_path.exists():
            continue

        blk_df = pd.read_parquet(blk_path)
        blk_df = blk_df[blk_df["LCLid"].isin(hhs)]

        for h, h_df in blk_df.groupby("LCLid"):
            h_indexed = h_df.set_index("day")[HH_COLS]
            h_usable = hh_usable_map.get(h, set())

            for w_id in sorted(h_usable):
                w_info = window_data[w_id]
                w_df = h_indexed.reindex(w_info["date_strs"])
                w_matrix = w_df.values.astype(float)

                feats = extract_features_from_window_readings(
                    window_matrix=w_matrix,
                    weekday_mask=w_info["weekday_mask"],
                )
                feats["household_id"] = str(h)
                feats["window_id"] = w_id
                records.append(feats)

    features_df = pd.DataFrame(records)

    # Ensure deterministic ordering: household_id, window_id
    order_cols = [
        "household_id",
        "window_id",
        "mean_load",
        "peak_load",
        "peak_to_average_ratio",
        "std_load",
        "ramp_rate_mean",
        "day_night_ratio",
        "weekday_weekend_contrast",
        "peak_timing",
    ]
    features_df = features_df.sort_values(["household_id", "window_id"]).reset_index(drop=True)[order_cols]

    # Validate contracts: no NaNs
    nan_count = features_df.isnull().sum().sum()
    if nan_count > 0:
        raise ValueError(f"Found {nan_count} NaNs in behavioral features!")

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        features_df.to_parquet(output_path, index=False, engine="pyarrow", compression="snappy")
        logger.info(f"Saved behavioral_features.parquet to {output_path} ({len(features_df):,} rows)")

    return features_df


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    artifacts_dir = get_artifacts_dir("latest")
    out_file = artifacts_dir / "behavioral_features.parquet"
    df = compute_behavioral_features(output_path=out_file)
    print(f"\nDone. Extracted {len(df):,} rows.")
    print(df.head(5))
