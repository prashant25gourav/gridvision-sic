"""Research table assembly module for GridVision (P2).

Constructs research_table.parquet by joining:
- P1's instability_volatility.parquet (at predictor window w)
- P2's forecast_global_summary.parquet (at outcome window w+1, trained up to w)
- P2's calibration_summary.parquet (for standardization)
- P2's extreme_failure_threshold.json (fixed threshold)
- P1's households_sampled.parquet (for acorn_grouped)
- P1's window_eligibility.parquet & calibration_assignment.parquet (for row eligibility)

Locked Research Rules (Master Plan v4 §8.5 & Blueprint v2 §C.9/§C.14/§D.5):
- Sole Source: GLOBAL forecaster only.
- Static Isolation: NEVER imports cluster_forecaster.py (enforced by runtime/static check).
- Literal Calendar Adjacency: window_w_plus_1 == calendar_successor(window_w).
  Non-adjacent pairs are DROPPED, never substituted.
- Both Windows Usable: Both window_w and window_w_plus_1 must be individually usable.
- Predictor in Analysis Period: window_w is strictly after household's calibration pair.
- Holdout Predecessor Rule: Holdout target is last_usable_window.
  Evaluated (is_holdout=True) ONLY if calendar_predecessor(last_usable_window) is usable.
  Otherwise household is marked ineligible for holdout (no row created).
- Fixed Pre-Determined Threshold: Labeled using threshold_std_error_95th from
  extreme_failure_threshold.json.

Output Artifact:
- data/artifacts/latest/research_table.parquet
  Columns: household_id, window_w, window_w_plus_1, instability, volatility_cv,
           ae, std_error, is_extreme_failure, acorn_grouped, is_holdout
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
import logging
import json
import numpy as np
import pandas as pd

from pipeline.config import get_project_root, get_artifacts_dir
from pipeline.windows.calendar import calendar_successor, calendar_predecessor
from pipeline.forecasting.error_standardization import standardize_error, label_extreme_failures

logger = logging.getLogger(__name__)


def build_research_table(
    instability_volatility_df: Optional[pd.DataFrame] = None,
    forecast_global_summary_df: Optional[pd.DataFrame] = None,
    calibration_summary_df: Optional[pd.DataFrame] = None,
    threshold_config: Optional[Dict[str, Any]] = None,
    calibration_assignment_df: Optional[pd.DataFrame] = None,
    eligibility_df: Optional[pd.DataFrame] = None,
    sampled_households_df: Optional[pd.DataFrame] = None,
    output_dir: Optional[Path] = None,
) -> pd.DataFrame:
    """Construct research_table.parquet according to locked rules.
    
    Args:
        instability_volatility_df: DataFrame from instability_volatility.parquet.
        forecast_global_summary_df: DataFrame from forecast_global_summary.parquet.
        calibration_summary_df: DataFrame from calibration_summary.parquet.
        threshold_config: Dict loaded from extreme_failure_threshold.json.
        calibration_assignment_df: DataFrame from calibration_assignment.parquet.
        eligibility_df: DataFrame from window_eligibility.parquet.
        sampled_households_df: DataFrame from households_sampled.parquet.
        output_dir: Destination path for research_table.parquet.
        
    Returns:
        pd.DataFrame containing the complete research table.
    """
    latest_artifacts = get_artifacts_dir("latest")

    if instability_volatility_df is None:
        instability_volatility_df = pd.read_parquet(latest_artifacts / "instability_volatility.parquet")

    if forecast_global_summary_df is None:
        forecast_global_summary_df = pd.read_parquet(latest_artifacts / "forecast_global_summary.parquet")

    if calibration_summary_df is None:
        calibration_summary_df = pd.read_parquet(latest_artifacts / "calibration_summary.parquet")

    if threshold_config is None:
        with open(latest_artifacts / "extreme_failure_threshold.json", "r", encoding="utf-8") as f:
            threshold_config = json.load(f)

    if calibration_assignment_df is None:
        calibration_assignment_df = pd.read_parquet(latest_artifacts / "calibration_assignment.parquet")

    if eligibility_df is None:
        eligibility_df = pd.read_parquet(latest_artifacts / "window_eligibility.parquet")

    if sampled_households_df is None:
        sampled_households_df = pd.read_parquet(latest_artifacts / "households_sampled.parquet")

    if output_dir is None:
        output_dir = latest_artifacts
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    threshold_95th = float(threshold_config["threshold_std_error_95th"])
    logger.info(f"Building research table with fixed threshold_95th = {threshold_95th:.4f}")

    # Build fast lookups
    # 1. Usability lookup: (household_id, window_id) -> bool
    usable_set: Set[Tuple[str, str]] = set()
    for _, row in eligibility_df[eligibility_df["is_usable"]].iterrows():
        usable_set.add((str(row["household_id"]), str(row["window_id"])))

    # 2. Household metadata & assignment
    acorn_map = dict(zip(sampled_households_df["household_id"], sampled_households_df["acorn_grouped"]))
    cal_assign_map = calibration_assignment_df.set_index("household_id").to_dict(orient="index")
    cal_summary_map = calibration_summary_df.set_index("household_id").to_dict(orient="index")

    # 3. Forecast summary lookup: (household_id, target_window, trained_up_to_window) -> ae
    forecast_map: Dict[Tuple[str, str, str], float] = {}
    for _, row in forecast_global_summary_df.iterrows():
        key = (str(row["household_id"]), str(row["window_id"]), str(row["trained_up_to_window"]))
        forecast_map[key] = float(row["ae"])

    # 4. Instability & Volatility lookup: (household_id, window_id) -> (instability, volatility_cv)
    # Filter to Analysis windows only
    analysis_metrics: Dict[Tuple[str, str], Tuple[float, float]] = {}
    for _, row in instability_volatility_df.iterrows():
        key = (str(row["household_id"]), str(row["window_id"]))
        analysis_metrics[key] = (float(row["instability"]), float(row["volatility_cv"]))

    records: List[Dict[str, Any]] = []
    skipped_non_adjacent = 0
    skipped_unusable_successor = 0
    skipped_no_forecast = 0
    eligible_holdout_count = 0
    ineligible_holdout_count = 0

    # Process per household
    for hh_id, assign in cal_assign_map.items():
        first_analysis = str(assign["first_analysis_window"])
        last_usable = str(assign["last_usable_window"])
        acorn = acorn_map.get(hh_id, "Unknown")
        cal_stats = cal_summary_map.get(hh_id)

        if not cal_stats:
            logger.warning(f"No calibration summary for household {hh_id}, skipping.")
            continue

        median_ae = float(cal_stats["calibration_median_ae"])
        mad = float(cal_stats["calibration_mad"])

        # Check holdout eligibility: calendar predecessor of last_usable must be usable
        holdout_pred = calendar_predecessor(last_usable)
        if holdout_pred and (hh_id, holdout_pred) in usable_set:
            eligible_holdout_count += 1
        else:
            ineligible_holdout_count += 1

        # Iterate through all possible predictor windows w in analysis
        # Candidate predictor windows are those present in analysis_metrics for hh_id
        hh_analysis_windows = [w for (h, w) in analysis_metrics.keys() if h == hh_id]
        # Sort chronologically
        hh_analysis_windows.sort()

        for w in hh_analysis_windows:
            # Predictor w must be >= first_analysis
            if w < first_analysis:
                continue

            # Target window is strictly the calendar successor
            w_plus_1 = calendar_successor(w)
            if not w_plus_1:
                # w is W14, no successor possible
                continue

            # Rule: Both w and w_plus_1 must be usable
            if (hh_id, w) not in usable_set:
                continue

            if (hh_id, w_plus_1) not in usable_set:
                skipped_unusable_successor += 1
                # Non-adjacent gap: strictly no row produced
                continue

            # Determine whether this is the household's holdout row
            if w_plus_1 == last_usable:
                is_holdout = True
            elif w_plus_1 < last_usable:
                is_holdout = False
            else:
                # Target window is beyond the household's last usable window
                continue

            # Lookup global forecast AE for (hh_id, w_plus_1) trained up to w
            fc_key = (hh_id, w_plus_1, w)
            if fc_key not in forecast_map:
                skipped_no_forecast += 1
                continue

            ae = forecast_map[fc_key]

            # Standardize error
            std_err = standardize_error(ae, median_ae, mad)
            is_extreme = label_extreme_failures(std_err, threshold_95th)

            records.append({
                "household_id": hh_id,
                "window_w": w,
                "window_w_plus_1": w_plus_1,
                "instability": analysis_metrics[(hh_id, w)][0],
                "volatility_cv": analysis_metrics[(hh_id, w)][1],
                "ae": round(float(ae), 5),
                "std_error": round(float(std_err), 5),
                "is_extreme_failure": bool(is_extreme),
                "acorn_grouped": acorn,
                "is_holdout": bool(is_holdout),
            })

    research_table = pd.DataFrame(records)

    # Sort deterministically
    research_table = research_table.sort_values(
        ["household_id", "window_w", "window_w_plus_1"]
    ).reset_index(drop=True)

    # Summary statistics
    total_rows = len(research_table)
    analysis_rows = len(research_table[~research_table["is_holdout"]])
    holdout_rows = len(research_table[research_table["is_holdout"]])
    extreme_rate = research_table["is_extreme_failure"].mean()

    logger.info(
        f"Research Table Assembly Complete:\n"
        f"  Total Rows: {total_rows:,}\n"
        f"  Analysis Rows (is_holdout=False): {analysis_rows:,}\n"
        f"  Holdout Rows (is_holdout=True): {holdout_rows:,}\n"
        f"  Eligible Holdout HHs: {eligible_holdout_count:,}, Ineligible: {ineligible_holdout_count:,}\n"
        f"  Positive Event Rate (Extreme Failure): {extreme_rate:.2%}\n"
        f"  Skipped Unusable Successors: {skipped_unusable_successor:,}"
    )

    out_file = output_dir / "research_table.parquet"
    research_table.to_parquet(out_file, index=False, engine="pyarrow", compression="snappy")
    logger.info(f"Saved research_table.parquet to {out_file}")

    return research_table


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    build_research_table()
