"""Calibration window selection module for GridVision.

Identifies each sampled household's own first 2 usable windows as its calibration pair,
its first Analysis window, and its final usable window (Holdout target).

Calibration Design:
- Calibration is per-household: own first 2 usable windows in chronological order.
- Guarantees n_analysis_windows >= 4 for every qualifying household.
- Avoids the rolling-enrollment failure mode where a global W01-W02 calibration
  period would have discarded 99.5% of households.

Artifact produced:
- data/artifacts/latest/calibration_assignment.parquet
  Grain: 1 row per sampled household (e.g. 620 rows)
  Columns:
    - household_id: str
    - calibration_window_1: str (e.g. 'W01')
    - calibration_window_2: str (e.g. 'W02')
    - first_analysis_window: str (e.g. 'W03')
    - last_usable_window: str (e.g. 'W14', holdout window)
    - n_analysis_windows: int (number of post-calibration usable windows, >= 4)
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import logging
import argparse
import pandas as pd

from pipeline.config import get_project_root, load_config

logger = logging.getLogger(__name__)


def assign_calibration_windows(
    sampled_households_df: pd.DataFrame,
    eligibility_df: pd.DataFrame,
    output_path: Optional[Path] = None,
) -> pd.DataFrame:
    """Assign per-household calibration windows and analysis sequence.
    
    Args:
        sampled_households_df: DataFrame of sampled households (must contain 'household_id').
        eligibility_df: DataFrame of window eligibility (household_id, window_id, is_usable).
        output_path: Optional path to save calibration_assignment.parquet.
        
    Returns:
        DataFrame of calibration assignments.
    """
    sampled_ids = set(sampled_households_df["household_id"])
    
    # Filter eligibility to sampled households and usable windows
    usable_elig = eligibility_df[
        eligibility_df["household_id"].isin(sampled_ids) & eligibility_df["is_usable"]
    ].copy()

    # Sort deterministically by household and window
    usable_elig = usable_elig.sort_values(["household_id", "window_id"]).reset_index(drop=True)

    records: List[Dict[str, Any]] = []

    for hh_id, group in usable_elig.groupby("household_id"):
        usable_windows = group["window_id"].tolist()
        if len(usable_windows) < 6:
            raise ValueError(
                f"Household {hh_id} has only {len(usable_windows)} usable windows; "
                f"minimum required for calibration assignment is 6."
            )

        cal_w1 = usable_windows[0]
        cal_w2 = usable_windows[1]
        first_ana = usable_windows[2]
        last_usable = usable_windows[-1]
        n_analysis = len(usable_windows) - 2

        records.append({
            "household_id": str(hh_id),
            "calibration_window_1": cal_w1,
            "calibration_window_2": cal_w2,
            "first_analysis_window": first_ana,
            "last_usable_window": last_usable,
            "n_analysis_windows": n_analysis,
        })

    assignment_df = pd.DataFrame(records)
    assignment_df = assignment_df.sort_values("household_id").reset_index(drop=True)

    # Validate contracts
    if len(assignment_df) != len(sampled_households_df):
        missing = sampled_ids - set(assignment_df["household_id"])
        raise ValueError(f"Missing calibration assignment for households: {missing}")

    if not (assignment_df["n_analysis_windows"] >= 4).all():
        violators = assignment_df[assignment_df["n_analysis_windows"] < 4]
        raise ValueError(f"Found households with n_analysis_windows < 4:\n{violators}")

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        assignment_df.to_parquet(output_path, index=False, engine="pyarrow", compression="snappy")
        logger.info(f"Saved calibration_assignment.parquet to {output_path} ({len(assignment_df)} rows)")

    return assignment_df
