"""Forward-only holdout evaluation module for GridVision (P2).

Applies the fixed primary statistical model and fixed extreme-failure threshold
to each eligible household's holdout window (its own LAST usable window).

Locked Research Rules (Master Plan v4 §4.5/§9 & Blueprint v2 §C.12/§D.8):
- Forward-Only: Strictly no fitting or re-tuning.
- Gate G7 Code Guard: Zero calls to .fit(), .fit_predict(), or any training routine.
- Predecessor Usability Rule: Only households whose immediately preceding calendar
  window was usable are evaluated in the holdout. Ineligible households are tracked.
- Output Artifact:
  data/artifacts/latest/holdout_results.json
"""

from pathlib import Path
from typing import Any, Dict, Optional
import logging
import json
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss, log_loss

from pipeline.config import get_artifacts_dir

logger = logging.getLogger(__name__)


def evaluate_holdout(
    research_table_df: Optional[pd.DataFrame] = None,
    statistical_results: Optional[Dict[str, Any]] = None,
    output_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """Perform forward-only evaluation on the holdout window.
    
    Args:
        research_table_df: DataFrame from research_table.parquet.
        statistical_results: Dict from statistical_results.json.
        output_dir: Destination path for holdout_results.json.
        
    Returns:
        Dict containing holdout evaluation metrics.
    """
    latest_artifacts = get_artifacts_dir("latest")

    if research_table_df is None:
        table_path = latest_artifacts / "research_table.parquet"
        research_table_df = pd.read_parquet(table_path)

    if statistical_results is None:
        stats_path = latest_artifacts / "statistical_results.json"
        with open(stats_path, "r", encoding="utf-8") as f:
            statistical_results = json.load(f)

    if output_dir is None:
        output_dir = latest_artifacts
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    # Filter to eligible holdout rows (is_holdout == True)
    holdout_df = research_table_df[research_table_df["is_holdout"]].copy()

    total_sampled = research_table_df["household_id"].nunique()
    n_eligible_holdout = len(holdout_df)
    n_ineligible_holdout = total_sampled - n_eligible_holdout

    if holdout_df.empty:
        logger.error("No eligible holdout rows found in research table.")
        raise ValueError("Research table contains zero holdout rows.")

    n_events = int(holdout_df["is_extreme_failure"].sum())
    holdout_event_rate = float(holdout_df["is_extreme_failure"].mean())

    logger.info(
        f"Evaluating holdout observations (Day 19 protocol):\n"
        f"  Total Sampled Households: {total_sampled:,}\n"
        f"  Eligible Holdout Observations: {n_eligible_holdout:,}\n"
        f"  Ineligible Holdout Households (Unusable Calendar Predecessor): {n_ineligible_holdout:,}\n"
        f"  Holdout Extreme Failures: {n_events:,} ({holdout_event_rate:.2%})"
    )

    # Retrieve fixed primary model coefficients (NO RETRAINING)
    coefs = statistical_results["primary_model"]["coefficients"]
    b0 = coefs["Intercept"]
    b_vol = coefs["volatility_cv"]
    b_inst = coefs["instability"]

    # Compute predicted logits & probabilities using fixed parameters
    logits = b0 + b_vol * holdout_df["volatility_cv"].values + b_inst * holdout_df["instability"].values
    probs = 1.0 / (1.0 + np.exp(-logits))
    y_true = holdout_df["is_extreme_failure"].astype(int).values

    # Check discrimination if both classes exist in holdout
    if len(np.unique(y_true)) > 1:
        roc_auc = float(roc_auc_score(y_true, probs))
        pr_auc = float(average_precision_score(y_true, probs))
        brier = float(brier_score_loss(y_true, probs))
        loss = float(log_loss(y_true, probs))
    else:
        roc_auc = None
        pr_auc = None
        brier = float(brier_score_loss(y_true, probs))
        loss = float(log_loss(y_true, probs))

    # Evaluate baseline restricted model (volatility only) for comparison
    coefs_restr = statistical_results["restricted_model"]["coefficients"]
    b0_r = coefs_restr["Intercept"]
    b_vol_r = coefs_restr["volatility_cv"]
    logits_r = b0_r + b_vol_r * holdout_df["volatility_cv"].values
    probs_r = 1.0 / (1.0 + np.exp(-logits_r))

    if len(np.unique(y_true)) > 1:
        roc_auc_r = float(roc_auc_score(y_true, probs_r))
        pr_auc_r = float(average_precision_score(y_true, probs_r))
    else:
        roc_auc_r = None
        pr_auc_r = None

    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "holdout_protocol": {
            "forward_only": True,
            "refit_performed": False,
            "gate_g7_guard": "PASSED (Zero training or tuning routines executed)",
        },
        "sample": {
            "total_sampled_households": total_sampled,
            "eligible_holdout_evaluated": n_eligible_holdout,
            "ineligible_holdout_predecessor_gap": n_ineligible_holdout,
            "holdout_extreme_failures": n_events,
            "holdout_event_rate": round(holdout_event_rate, 4),
        },
        "fixed_model_performance": {
            "primary_model_roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
            "primary_model_pr_auc": round(pr_auc, 4) if pr_auc is not None else None,
            "restricted_model_roc_auc": round(roc_auc_r, 4) if roc_auc_r is not None else None,
            "restricted_model_pr_auc": round(pr_auc_r, 4) if pr_auc_r is not None else None,
            "delta_roc_auc": round(roc_auc - roc_auc_r, 4) if roc_auc is not None and roc_auc_r is not None else None,
            "brier_score": round(brier, 5),
            "log_loss": round(loss, 5),
        },
        "coefficients_applied": {
            "intercept": b0,
            "volatility_cv": b_vol,
            "instability": b_inst,
        },
        "status": "COMPLETED",
    }

    out_file = output_dir / "holdout_results.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    logger.info(
        f"Holdout Evaluation Complete:\n"
        f"  Eligible Evaluated: {n_eligible_holdout:,} / {total_sampled:,}\n"
        f"  Primary Model ROC-AUC: {roc_auc}\n"
        f"  Primary Model PR-AUC: {pr_auc}\n"
        f"  Restricted Model ROC-AUC: {roc_auc_r}\n"
        f"  Saved to: {out_file}"
    )

    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    evaluate_holdout()
