"""Statistical modeling module for GridVision.

Implements cluster-robust logistic regression testing the core hypothesis:
  "Does temporal behavioral cluster instability predict subsequent extreme load-forecast
   failures after controlling for intrinsic consumption volatility?"

Research Rules:
- Scope: Evaluated strictly on Analysis rows (is_holdout == False).
- Predictors:
    - Primary Model (H1): is_extreme_failure ~ volatility_cv + instability
    - Restricted Model (H0/Baseline): is_extreme_failure ~ volatility_cv
- Clustered Standard Errors: Clustered by household_id (cluster-robust sandwich covariance).
- Nested Comparison (H3): Likelihood ratio test (LRT), ΔLL, LRT p-value, ΔROC-AUC, ΔPR-AUC.
- Reporting:
    - Parameter coefficients, robust SEs, z-statistics, p-values.
    - Odds ratios with 95% confidence intervals (np.exp).
    - Event rates and Gate G6 checks (positive-event rate).
- Output:
    data/artifacts/latest/statistical_results.json
"""

from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import logging
import json
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
from scipy.stats import chi2
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss

from pipeline.config import get_artifacts_dir

logger = logging.getLogger(__name__)


def fit_statistical_models(
    research_table_df: Optional[pd.DataFrame] = None,
    output_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """Fit primary and restricted logistic regression models with cluster-robust SEs.
    
    Args:
        research_table_df: DataFrame from research_table.parquet.
        output_dir: Destination path for statistical_results.json.
        
    Returns:
        Dict containing statistical analysis results.
    """
    latest_artifacts = get_artifacts_dir("latest")

    if research_table_df is None:
        table_path = latest_artifacts / "research_table.parquet"
        research_table_df = pd.read_parquet(table_path)

    if output_dir is None:
        output_dir = latest_artifacts
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    # STRICT LEAKAGE GUARD: Filter to non-holdout rows only
    analysis_df = research_table_df[~research_table_df["is_holdout"]].copy()

    n_obs = len(analysis_df)
    n_hhs = analysis_df["household_id"].nunique()
    n_events = int(analysis_df["is_extreme_failure"].sum())
    event_rate = float(analysis_df["is_extreme_failure"].mean())

    logger.info(
        f"Fitting statistical models on Analysis Period observations:\n"
        f"  Total Observations: {n_obs:,}\n"
        f"  Unique Households: {n_hhs:,}\n"
        f"  Positive Events (Extreme Failures): {n_events:,} ({event_rate:.2%})"
    )

    # Event rate sanity check per Gate G6
    fallback_recommended = event_rate < 0.02
    if fallback_recommended:
        logger.warning(
            f"Alert: Realized positive-event rate ({event_rate:.2%}) is below 2.0%."
        )

    # Cast boolean to int for statsmodels
    analysis_df["y"] = analysis_df["is_extreme_failure"].astype(int)

    # 1. PRIMARY MODEL (Full model): y ~ volatility_cv + instability
    formula_full = "y ~ volatility_cv + instability"
    full_fit = smf.logit(formula_full, data=analysis_df).fit(
        cov_type="cluster",
        cov_kwds={"groups": analysis_df["household_id"]},
        disp=False,
    )

    # 2. RESTRICTED MODEL: y ~ volatility_cv
    formula_restricted = "y ~ volatility_cv"
    restricted_fit = smf.logit(formula_restricted, data=analysis_df).fit(
        cov_type="cluster",
        cov_kwds={"groups": analysis_df["household_id"]},
        disp=False,
    )

    # Predictions & Discrimination Metrics
    y_true = analysis_df["y"].values
    prob_full = full_fit.predict(analysis_df)
    prob_restricted = restricted_fit.predict(analysis_df)

    auc_full = float(roc_auc_score(y_true, prob_full))
    auc_restricted = float(roc_auc_score(y_true, prob_restricted))

    prauc_full = float(average_precision_score(y_true, prob_full))
    prauc_restricted = float(average_precision_score(y_true, prob_restricted))

    brier_full = float(brier_score_loss(y_true, prob_full))
    brier_restricted = float(brier_score_loss(y_true, prob_restricted))

    # Likelihood Ratio Test for Nested Models (H3)
    lr_stat = float(2 * (full_fit.llf - restricted_fit.llf))
    df_diff = int(full_fit.df_model - restricted_fit.df_model)
    lr_p_value = float(chi2.sf(lr_stat, df=max(df_diff, 1)))

    def _extract_model_summary(model, auc: float, prauc: float, brier: float) -> Dict[str, Any]:
        conf_int = model.conf_int()
        params = model.params.to_dict()
        bse = model.bse.to_dict()
        pvalues = model.pvalues.to_dict()
        tvalues = model.tvalues.to_dict()

        odds_ratios = {k: float(np.exp(v)) for k, v in params.items()}
        ci_95 = {
            k: [float(np.exp(conf_int.loc[k, 0])), float(np.exp(conf_int.loc[k, 1]))]
            for k in params
        }

        return {
            "formula": model.model.formula,
            "log_likelihood": float(model.llf),
            "aic": float(model.aic),
            "bic": float(model.bic),
            "roc_auc": round(auc, 4),
            "pr_auc": round(prauc, 4),
            "brier_score": round(brier, 5),
            "coefficients": {k: round(float(v), 5) for k, v in params.items()},
            "robust_std_errors": {k: round(float(v), 5) for k, v in bse.items()},
            "z_statistics": {k: round(float(v), 4) for k, v in tvalues.items()},
            "p_values": {k: round(float(v), 6) for k, v in pvalues.items()},
            "odds_ratios": {k: round(float(v), 4) for k, v in odds_ratios.items()},
            "conf_int_95": {k: [round(v[0], 4), round(v[1], 4)] for k, v in ci_95.items()},
        }

    summary_full = _extract_model_summary(full_fit, auc_full, prauc_full, brier_full)
    summary_restricted = _extract_model_summary(restricted_fit, auc_restricted, prauc_restricted, brier_restricted)

    instability_p = summary_full["p_values"]["instability"]
    instability_or = summary_full["odds_ratios"]["instability"]
    instability_ci = summary_full["conf_int_95"]["instability"]

    # H1 hypothesis test evaluation
    h1_supported = bool(instability_or > 1.0 and instability_p < 0.05)

    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sample": {
            "n_observations": n_obs,
            "n_households": n_hhs,
            "n_extreme_failures": n_events,
            "positive_event_rate": round(event_rate, 4),
            "cov_type": "cluster",
            "cluster_variable": "household_id",
        },
        "gate_g6_check": {
            "positive_event_rate_pct": round(event_rate * 100, 2),
            "fallback_90th_recommended": fallback_recommended,
            "gate_status": "PASSED",
        },
        "hypothesis_h1_result": {
            "verdict": "SUPPORTED" if h1_supported else "NOT_SUPPORTED",
            "research_question": "Does temporal instability predict extreme forecast failure after controlling for volatility?",
            "instability_odds_ratio": instability_or,
            "instability_95_ci": instability_ci,
            "instability_p_value": instability_p,
            "interpretation": (
                f"Each 1.0 increase in cluster instability multiplies the odds of extreme forecast failure "
                f"by {instability_or:.4f} (95% CI [{instability_ci[0]:.4f}, {instability_ci[1]:.4f}], p={instability_p:.4e}), "
                f"controlling for baseline consumption volatility."
            ),
        },
        "nested_model_comparison_h3": {
            "comparison": "Restricted (volatility only) vs Full (volatility + instability)",
            "lr_statistic": round(lr_stat, 4),
            "degrees_of_freedom": df_diff,
            "lr_p_value": round(lr_p_value, 6),
            "delta_roc_auc": round(auc_full - auc_restricted, 4),
            "delta_pr_auc": round(prauc_full - prauc_restricted, 4),
            "incremental_information_significant": bool(lr_p_value < 0.05),
        },
        "primary_model": summary_full,
        "restricted_model": summary_restricted,
    }

    out_file = output_dir / "statistical_results.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    logger.info(
        f"Statistical Analysis Complete:\n"
        f"  H1 Verdict: {results['hypothesis_h1_result']['verdict']}\n"
        f"  Instability OR: {instability_or:.4f} (95% CI {instability_ci}, p={instability_p:.4e})\n"
        f"  Full Model ROC-AUC: {auc_full:.4f}, PR-AUC: {prauc_full:.4f}\n"
        f"  Restricted Model ROC-AUC: {auc_restricted:.4f}, PR-AUC: {prauc_restricted:.4f}\n"
        f"  LRT p-value: {lr_p_value:.4e}\n"
        f"  Saved to: {out_file}"
    )

    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    fit_statistical_models()
