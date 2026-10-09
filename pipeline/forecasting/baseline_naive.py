"""Seasonal-naive baseline forecaster module for GridVision.

Implements the baseline benchmark forecaster:

Definition of Seasonal-Naive Baseline:
For each household h and calendar transition w -> w+1, the seasonal-naive prediction
for each half-hour slot in window w+1 is the household's empirical mean consumption
during window w for the exact same (day_of_week, half_hour).

Produces:
- data/artifacts/latest/baseline_comparison.json
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
import logging
import argparse
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error

from pipeline.config import get_project_root, get_artifacts_dir
from pipeline.windows.calendar import get_window_map, calendar_predecessor

logger = logging.getLogger(__name__)

HH_COLS = [f"hh_{i}" for i in range(48)]


def compute_seasonal_naive_forecast(
    household_readings_w: pd.DataFrame,
    w_train_dates: List[str],
    w_target_dates: List[str],
) -> np.ndarray:
    """Compute seasonal-naive predictions for window w+1 using window w's profile.
    
    Args:
        household_readings_w: DataFrame indexed by day containing HH_COLS.
        w_train_dates: List of 56 date strings for predictor window w.
        w_target_dates: List of 56 date strings for target window w+1.
        
    Returns:
        1D array of 2,688 seasonal-naive predicted values.
    """
    # Extract window w readings matrix (56 days, 48 half-hours)
    r_w = household_readings_w.reindex(w_train_dates).values
    # Flatten and interpolate any missing values safely
    r_w_flat = pd.Series(r_w.flatten()).interpolate().bfill().ffill().fillna(0.0).values
    r_w_mat = r_w_flat.reshape(len(w_train_dates), 48)

    dows_train = [pd.to_datetime(d).dayofweek for d in w_train_dates]
    dow_hh_means = {}
    hh_overall_means = r_w_mat.mean(axis=0)

    for dow in range(7):
        mask = [i for i, d in enumerate(dows_train) if d == dow]
        if mask:
            dow_hh_means[dow] = r_w_mat[mask].mean(axis=0)
        else:
            dow_hh_means[dow] = hh_overall_means

    # Generate predictions for each slot in w+1
    preds = []
    dows_target = [pd.to_datetime(d).dayofweek for d in w_target_dates]
    for d_idx, d in enumerate(w_target_dates):
        dow = dows_target[d_idx]
        profile = dow_hh_means.get(dow, hh_overall_means)
        preds.extend(profile)

    return np.array(preds, dtype=float)


def evaluate_baseline_comparison(
    forecast_global_df: Optional[pd.DataFrame] = None,
    output_path: Optional[Path] = None,
    interim_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """Compare global forecaster performance against the seasonal-naive baseline.
    
    Args:
        forecast_global_df: DataFrame from forecast_global.parquet.
        output_path: Destination path for baseline_comparison.json.
        interim_dir: Path to directory containing block_*.parquet.
        
    Returns:
        Dict containing comparison metrics.
    """
    root = get_project_root()
    latest_artifacts = get_artifacts_dir("latest")

    if forecast_global_df is None:
        fg_path = latest_artifacts / "forecast_global.parquet"
        if not fg_path.exists():
            raise FileNotFoundError(f"Global forecast artifact not found at {fg_path}")
        logger.info(f"Loading global forecasts from {fg_path}...")
        forecast_global_df = pd.read_parquet(fg_path)

    if interim_dir is None:
        interim_dir = root / "data" / "interim" / "blocks"
    else:
        interim_dir = Path(interim_dir)

    wmap = get_window_map()

    # Pre-index readings by household from interim blocks
    active_hhs = set(forecast_global_df["household_id"].unique())
    logger.info(f"Evaluating baseline comparison for {len(active_hhs):,} households...")

    # Group evaluation by (household_id, window_id)
    comparisons = []
    total_slots_evaluated = 0

    # Group forecast df by window_id to process transition by transition
    for w_target, w_group in forecast_global_df.groupby("window_id"):
        w_pred = calendar_predecessor(str(w_target))
        if not w_pred:
            continue

        w_train_dates = pd.date_range(wmap[w_pred].start_date, wmap[w_pred].end_date, freq="D").strftime("%Y-%m-%d").tolist()
        w_target_dates = pd.date_range(wmap[w_target].start_date, wmap[w_target].end_date, freq="D").strftime("%Y-%m-%d").tolist()

        # Find block files for households in this window
        hhs_in_w = set(w_group["household_id"].unique())

        # Process per household
        for h, h_group in w_group.groupby("household_id"):
            h_str = str(h)
            actuals = h_group["actual"].values
            preds_global = h_group["predicted"].values

            if len(actuals) != 2688:
                continue

            # Load actual readings for predecessor window from interim
            # Using cached or direct lookup
            mae_global = float(mean_absolute_error(actuals, preds_global))
            rmse_global = float(np.sqrt(mean_squared_error(actuals, preds_global)))

            comparisons.append({
                "household_id": h_str,
                "window_target": str(w_target),
                "window_predictor": w_pred,
                "mae_global": round(mae_global, 5),
                "rmse_global": round(rmse_global, 5),
                "actuals": actuals,
            })

    # Summary metrics
    df_comp = pd.DataFrame(comparisons)
    global_mae_mean = float(df_comp["mae_global"].mean()) if not df_comp.empty else 0.0
    global_rmse_mean = float(df_comp["rmse_global"].mean()) if not df_comp.empty else 0.0

    results = {
        "definition": "Seasonal-naive baseline predicts window w+1 using household's mean (day_of_week, half_hour) profile from window w.",
        "n_evaluations": len(df_comp),
        "global_forecaster": {
            "mean_mae": round(global_mae_mean, 5),
            "mean_rmse": round(global_rmse_mean, 5),
        },
        "baseline_naive": {
            "mean_mae": None,
            "mean_rmse": None,
        },
        "comparison": {
            "global_beats_naive_mae": None,
            "global_beats_naive_rmse": None,
        }
    }

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        logger.info(f"Saved baseline_comparison.json to {output_path}")

    return results


def run_full_baseline_comparison(
    forecast_global_df: pd.DataFrame,
    interim_dir: Path,
    hh_to_block: Dict[str, str],
    output_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Execute complete seasonal-naive baseline comparison using raw readings."""
    root = get_project_root()
    latest_artifacts = get_artifacts_dir("latest")
    wmap = get_window_map()

    # Pre-load required readings for predecessor windows
    # Group households by block
    block_to_hhs: Dict[str, List[str]] = {}
    active_hhs = set(forecast_global_df["household_id"].unique())
    for h in active_hhs:
        blk = hh_to_block.get(h)
        if blk:
            block_to_hhs.setdefault(blk, []).append(h)

    readings_by_hh: Dict[str, pd.DataFrame] = {}
    for blk_name, hhs in block_to_hhs.items():
        blk_path = interim_dir / f"{blk_name}.parquet"
        if not blk_path.exists():
            continue
        b_df = pd.read_parquet(blk_path)
        for h in hhs:
            readings_by_hh[h] = b_df[b_df["LCLid"] == h].set_index("day")[HH_COLS]

    logger.info(f"Preloaded readings for {len(readings_by_hh)} households for baseline comparison.")

    records = []
    hhs_global_wins_mae = 0
    hhs_global_wins_rmse = 0
    total_evals = 0

    for (h, w_target), h_group in forecast_global_df.groupby(["household_id", "window_id"]):
        h_str = str(h)
        w_t = str(w_target)
        w_pred = calendar_predecessor(w_t)
        if not w_pred or h_str not in readings_by_hh:
            continue

        actuals = h_group["actual"].values
        preds_global = h_group["predicted"].values
        if len(actuals) != 2688:
            continue

        w_train_dates = pd.date_range(wmap[w_pred].start_date, wmap[w_pred].end_date, freq="D").strftime("%Y-%m-%d").tolist()
        w_target_dates = pd.date_range(wmap[w_t].start_date, wmap[w_t].end_date, freq="D").strftime("%Y-%m-%d").tolist()

        preds_naive = compute_seasonal_naive_forecast(
            household_readings_w=readings_by_hh[h_str],
            w_train_dates=w_train_dates,
            w_target_dates=w_target_dates,
        )

        mae_g = float(mean_absolute_error(actuals, preds_global))
        rmse_g = float(np.sqrt(mean_squared_error(actuals, preds_global)))
        mae_n = float(mean_absolute_error(actuals, preds_naive))
        rmse_n = float(np.sqrt(mean_squared_error(actuals, preds_naive)))

        if mae_g < mae_n:
            hhs_global_wins_mae += 1
        if rmse_g < rmse_n:
            hhs_global_wins_rmse += 1
        total_evals += 1

        records.append({
            "household_id": h_str,
            "window_id": w_t,
            "mae_global": round(mae_g, 5),
            "mae_naive": round(mae_n, 5),
            "rmse_global": round(rmse_g, 5),
            "rmse_naive": round(rmse_n, 5),
            "global_beats_naive_mae": mae_g < mae_n,
            "global_beats_naive_rmse": rmse_g < rmse_n,
        })

    df_res = pd.DataFrame(records)
    mean_mae_g = float(df_res["mae_global"].mean())
    mean_mae_n = float(df_res["mae_naive"].mean())
    mean_rmse_g = float(df_res["rmse_global"].mean())
    mean_rmse_n = float(df_res["rmse_naive"].mean())

    win_rate_mae = float(hhs_global_wins_mae / total_evals) if total_evals > 0 else 0.0
    win_rate_rmse = float(hhs_global_wins_rmse / total_evals) if total_evals > 0 else 0.0

    summary = {
        "status": "COMPLETED",
        "definition": "Seasonal-naive baseline: household's mean consumption during window w for the matching (day_of_week, half_hour) slot.",
        "total_evaluations": total_evals,
        "global_forecaster": {
            "mean_mae": round(mean_mae_g, 5),
            "mean_rmse": round(mean_rmse_g, 5),
        },
        "baseline_naive": {
            "mean_mae": round(mean_mae_n, 5),
            "mean_rmse": round(mean_rmse_n, 5),
        },
        "comparison": {
            "global_beats_naive_mae": mean_mae_g < mean_mae_n,
            "global_beats_naive_rmse": mean_rmse_g < mean_rmse_n,
            "mae_reduction_pct": round(((mean_mae_n - mean_mae_g) / mean_mae_n) * 100, 2),
            "rmse_reduction_pct": round(((mean_rmse_n - mean_rmse_g) / mean_rmse_n) * 100, 2),
            "household_win_rate_mae": round(win_rate_mae, 4),
            "household_win_rate_rmse": round(win_rate_rmse, 4),
        }
    }

    if output_path is not None:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        logger.info(f"Saved baseline_comparison.json to {output_path}")

    return summary
