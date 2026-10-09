"""Window eligibility module for GridVision (P1).

Computes slot completeness and maximum consecutive gap for every flat-rate
household across all 14 common-calendar windows.

Artifact produced:
- data/artifacts/latest/window_eligibility.parquet (or specified output path)
  Grain: 1 row per (household_id, window_id) (14 rows per household)
  Columns:
    - household_id: str
    - window_id: str (W01..W14)
    - slot_fill_pct: float (0.0 to 1.0)
    - max_gap_days: float
    - is_usable: bool
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import glob
import logging
import argparse
import numpy as np
import pandas as pd

from pipeline.config import get_project_root, load_config
from pipeline.windows.calendar import get_calendar_windows
from pipeline.quality.checks import compute_slot_metrics, EXPECTED_SLOTS_PER_WINDOW

logger = logging.getLogger(__name__)

HH_COLS = [f"hh_{i}" for i in range(48)]


def compute_dataset_window_eligibility(
    interim_dir: Optional[Path] = None,
    output_path: Optional[Path] = None,
) -> pd.DataFrame:
    """Compute 14-window usability for all flat-rate households from interim Parquet blocks.
    
    Args:
        interim_dir: Directory containing block_*.parquet files.
        output_path: Destination path for window_eligibility.parquet.
        
    Returns:
        DataFrame containing window eligibility rows.
    """
    root = get_project_root()
    config = load_config()

    if interim_dir is None:
        interim_dir = root / config["paths"]["interim_dir"] / "blocks"
    else:
        interim_dir = Path(interim_dir)

    windows = get_calendar_windows()
    window_ids = [w.id for w in windows]

    # Pre-build full 784-day common date range (14 * 56 days)
    all_dates = []
    for w in windows:
        all_dates.extend(pd.date_range(w.start_date, w.end_date, freq="D").strftime("%Y-%m-%d"))
    all_dates_idx = pd.Index(all_dates)

    block_files = sorted(glob.glob(str(interim_dir / "block_*.parquet")))
    if not block_files:
        raise FileNotFoundError(f"No interim Parquet blocks found in {interim_dir}")

    records: List[Dict[str, Any]] = []

    for block_file in block_files:
        df = pd.read_parquet(block_file)
        for h, h_df in df.groupby("LCLid"):
            h_indexed = h_df.set_index("day")[HH_COLS]
            w_df = h_indexed.reindex(all_dates_idx)
            # Reshape into (14 windows, 2688 half-hours)
            arr = w_df.values.reshape(14, EXPECTED_SLOTS_PER_WINDOW)

            for w_idx, w_id in enumerate(window_ids):
                slot_fill_pct, max_gap_days, is_usable = compute_slot_metrics(arr[w_idx])
                records.append({
                    "household_id": str(h),
                    "window_id": w_id,
                    "slot_fill_pct": slot_fill_pct,
                    "max_gap_days": max_gap_days,
                    "is_usable": is_usable,
                })

    eligibility_df = pd.DataFrame(records)
    eligibility_df = eligibility_df.sort_values(["household_id", "window_id"]).reset_index(drop=True)

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        eligibility_df.to_parquet(output_path, index=False, engine="pyarrow", compression="snappy")
        logger.info(f"Saved window_eligibility.parquet to {output_path} ({len(eligibility_df):,} rows)")

    return eligibility_df


def get_qualifying_households(
    eligibility_df: pd.DataFrame,
    min_usable: int = 6,
) -> pd.DataFrame:
    """Summarize usable window counts and filter to qualifying households (>= min_usable).
    
    Args:
        eligibility_df: DataFrame with household_id, window_id, is_usable.
        min_usable: Minimum number of usable windows to qualify. Default 6.
        
    Returns:
        DataFrame with household_id, n_usable_windows, sorted descending by usable windows.
    """
    usable_summary = (
        eligibility_df.groupby("household_id")["is_usable"]
        .sum()
        .reset_index(name="n_usable_windows")
    )
    qualifying = usable_summary[usable_summary["n_usable_windows"] >= min_usable].copy()
    qualifying = qualifying.sort_values(["n_usable_windows", "household_id"], ascending=[False, True]).reset_index(drop=True)
    return qualifying
