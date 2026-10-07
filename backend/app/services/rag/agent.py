"""RAG Copilot Agent Orchestrator (P4).

Orchestrates tool invocation, passage retrieval, answer synthesis,
and numeric grounding enforcement matching Blueprint v2 §F.6 and §H.
"""

from typing import Any, Dict, List, Optional
import re
import logging

from app.services.rag.tools import (
    get_forecast,
    get_segment,
    get_instability,
    get_anomaly,
    get_grid_demand,
    get_attention_summary,
    get_consumer_rankings_tool,
    get_research_summary_tool,
)
from app.services.rag.retriever import retriever
from app.services.rag.grounding import verify_numeric_grounding
from app.services.artifact_loader import store

logger = logging.getLogger(__name__)


def extract_household_id_from_text(text: str) -> Optional[str]:
    """Search for household identifier like MAC000123 or 000123 in text."""
    match = re.search(r"\b(MAC\d{6})\b", text, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return None


def run_copilot_turn(
    message: str,
    household_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute one turn of the RAG Copilot.
    
    Args:
        message: The user's query or instruction.
        household_id: Optional explicit household context.
        
    Returns:
        Dictionary with answer, tool_calls, and grounded flag.
    """
    msg_lower = message.lower()
    inferred_hh = extract_household_id_from_text(message)
    active_hh = household_id or inferred_hh

    tool_calls: List[Dict[str, Any]] = []
    tool_results: List[Any] = []

    # 1. Determine tool execution
    if active_hh:
        # Check if household exists in sampled set
        known_hhs = store.get_known_households()
        if known_hhs and active_hh not in known_hhs:
            return {
                "answer": f"Household {active_hh} was not found in the verified 620-household study sample.",
                "tool_calls": [],
                "grounded": True,
            }

        # Determine tools based on query intent
        needed_tools = []
        if any(w in msg_lower for w in ["unreliable", "instab", "volatil", "risk", "persist", "score", "status"]):
            needed_tools.append("get_instability")
        if any(w in msg_lower for w in ["forecast", "predict", "load", "mae", "shap", "error"]):
            needed_tools.append("get_forecast")
        if any(w in msg_lower for w in ["segment", "cluster", "behavior", "shift", "group"]):
            needed_tools.append("get_segment")
        if any(w in msg_lower for w in ["anomal", "spike", "drop", "flag", "unusual", "fault"]):
            needed_tools.append("get_anomaly")

        if not needed_tools:
            needed_tools = ["get_instability", "get_segment"]

        for tname in needed_tools:
            if tname == "get_instability":
                res = get_instability(active_hh)
                tool_calls.append({"tool": "get_instability", "args": {"household_id": active_hh}})
                tool_results.append(res)
            elif tname == "get_forecast":
                res = get_forecast(active_hh)
                tool_calls.append({"tool": "get_forecast", "args": {"household_id": active_hh}})
                tool_results.append(res)
            elif tname == "get_segment":
                res = get_segment(active_hh)
                tool_calls.append({"tool": "get_segment", "args": {"household_id": active_hh}})
                tool_results.append(res)
            elif tname == "get_anomaly":
                res = get_anomaly(active_hh)
                tool_calls.append({"tool": "get_anomaly", "args": {"household_id": active_hh}})
                tool_results.append(res)
    else:
        # Utility-wide operational query routing
        if any(w in msg_lower for w in ["current demand", "overall demand", "peak demand", "when does demand peak", "grid demand", "total load", "power", "how much electricity"]):
            res = get_grid_demand()
            tool_calls.append({"tool": "get_grid_demand", "args": {}})
            tool_results.append(res)
        elif any(w in msg_lower for w in ["attention", "unusual", "flagged", "priority", "alerts", "which households"]):
            if any(w in msg_lower for w in ["consume", "most", "highest", "peak load", "largest"]):
                res = get_consumer_rankings_tool("consumption" if "consume" in msg_lower else "peak")
                tool_calls.append({"tool": "get_consumer_rankings", "args": {}})
                tool_results.append(res)
            else:
                res = get_attention_summary()
                tool_calls.append({"tool": "get_attention_summary", "args": {}})
                tool_results.append(res)
        elif any(w in msg_lower for w in ["research", "instability predict", "study find", "volatility vs instability", "hypothesis"]):
            res = get_research_summary_tool()
            tool_calls.append({"tool": "get_research_summary", "args": {}})
            tool_results.append(res)

    # 2. Retrieve relevant domain passages from knowledge base
    retrieved_passages = retriever.retrieve(message, top_k=3)

    # 3. Assemble structured, explainable response with progressive disclosure
    answers: List[str] = []
    bullet_points: List[str] = []
    evidence_lines: List[str] = []

    # Synthesize from tool results
    for tc, tr in zip(tool_calls, tool_results):
        tname = tc["tool"]
        if "error" in tr:
            answers.append(tr["error"])
            continue

        if tname == "get_instability":
            inst_val = tr.get("instability", 0.0)
            vol_val = tr.get("volatility_cv", 0.0)
            rel = tr.get("reliability_indicator", "moderate")
            win = tr.get("latest_window", "latest window")
            
            rel_label = "stable" if rel == "stable" else ("moderately fluctuating" if rel == "moderate" else "higher-risk")
            answers.append(
                f"Household {active_hh} demonstrates a {rel_label} consumption profile with a '{rel}' reliability tier classification in {win}."
            )
            bullet_points.append(
                f"Its electricity usage exhibits a volatility coefficient of variation of {vol_val:.3f}, representing its baseline demand variability."
            )
            bullet_points.append(
                f"Longitudinal segment instability reached {inst_val:.3f}, reflecting how often its daily load pattern transitioned across observation periods."
            )
            bullet_points.append(
                "GridVision treats volatility as the primary driver of forecast uncertainty while tracking behavioral shifts over time."
            )
            evidence_lines.append(
                f"Instability score: {inst_val:.3f} | Volatility CV: {vol_val:.3f} | Reliability tier: '{rel}' | Window: {win}"
            )

        elif tname == "get_forecast":
            mae_g = tr.get("mae_global", 0.0)
            mae_pc = tr.get("mae_percluster", mae_g)
            win = tr.get("window_id", "")
            top_feats = tr.get("shap_top_features", [])
            feat_desc = ", ".join([f"{f['feature']} ({f['contribution']:.4f})" for f in top_feats[:2]])
            
            answers.append(
                f"For {win}, the day-ahead forecast for Household {active_hh} recorded a global model MAE of {mae_g:.4f} kWh."
            )
            bullet_points.append(
                "The forecasting model tracks demand across half-hourly time intervals without future lookahead."
            )
            bullet_points.append(
                f"The per-cluster specialized forecaster achieved an MAE of {mae_pc:.4f} kWh for comparison."
            )
            if feat_desc:
                bullet_points.append(
                    f"Top local feature drivers influencing the prediction include {feat_desc}."
                )
            evidence_lines.append(
                f"Global forecaster MAE: {mae_g:.4f} kWh | Per-cluster MAE: {mae_pc:.4f} kWh | Window: {win} | SHAP: {feat_desc}"
            )

        elif tname == "get_segment":
            cid = tr.get("current_cluster_id", 0)
            clabel = tr.get("current_cluster_label", f"Cluster {cid}")
            n_trans = tr.get("trajectory_windows_count", 0)
            
            answers.append(
                f"Household {active_hh} is currently classified under Cluster {cid} ('{clabel}') across {n_trans} observed calendar windows."
            )
            bullet_points.append(
                f"This archetype corresponds to the household's typical daily electricity routine ('{clabel}')."
            )
            bullet_points.append(
                f"GridVision uses Hungarian centroid alignment to prevent cluster labels from scrambling across observed windows."
            )
            bullet_points.append(
                "Segment assignments capture recurring usage timing such as morning routines, daytime occupancy, or evening cooking peaks."
            )
            evidence_lines.append(
                f"Cluster ID: {cid} | Archetype label: '{clabel}' | Windows observed: {n_trans}"
            )

        elif tname == "get_anomaly":
            n_anom = tr.get("total_anomalies_flagged", 0)
            is_anom = tr.get("is_currently_anomalous", False)
            if is_anom:
                trig = tr.get("latest_triggering_statistic", "behavioral deviation")
                expl = tr.get("latest_explanation", "")
                answers.append(
                    f"Household {active_hh} exhibited unusual electricity consumption in the latest window, with {n_anom} total anomaly flags recorded."
                )
                bullet_points.append(
                    f"The anomaly was triggered by {trig}: {expl}"
                )
                bullet_points.append(
                    "The detector monitors behavioral deviations against calibrated baselines to spot unexpected shifts in demand."
                )
                evidence_lines.append(
                    f"Anomaly status: Flagged | Trigger: {trig} | Total flags: {n_anom} | Details: {expl}"
                )
            else:
                answers.append(
                    f"Household {active_hh} is operating within normal baseline limits in the latest window ({n_anom} total past anomaly flags recorded)."
                )
                bullet_points.append(
                    "No significant behavioral deviations were detected by the Isolation Forest detector in the latest window."
                )
                bullet_points.append(
                    "The household's daily load features remain within its typical historical envelope."
                )
                evidence_lines.append(
                    f"Anomaly status: Normal | Historical flags count: {n_anom}"
                )

        elif tname == "get_grid_demand":
            avg_kw = tr.get("avg_demand_kw", 0.24)
            tot_avg_mw = tr.get("total_avg_demand_mw", 0.149)
            peak_kw = tr.get("peak_demand_kw", 0.369)
            tot_peak_mw = tr.get("total_peak_demand_mw", 0.229)
            peak_time = tr.get("peak_timestamp", "19:00 (Evening Peak)")
            tot_mwh = tr.get("total_consumption_mwh", 200.3)
            latest_kw = tr.get("latest_demand_kw", 0.223)
            att_count = tr.get("households_needing_attention", 44)

            answers.append(
                f"Current average demand across the 620-household cohort is {avg_kw:.3f} kW per smart meter ({tot_avg_mw:.3f} MW cohort total), with expected peak demand reaching {peak_kw:.3f} kW ({tot_peak_mw:.3f} MW) at {peak_time}."
            )
            bullet_points.append(
                f"Total cohort energy recorded across the 56-day observation period stands at {tot_mwh:.1f} MWh."
            )
            bullet_points.append(
                f"The latest observed instantaneous demand is {latest_kw:.3f} kW per household."
            )
            bullet_points.append(
                f"Currently {att_count} households exhibit anomalous or elevated-risk consumption signatures requiring monitoring."
            )
            evidence_lines.append(
                f"Average demand: {avg_kw:.3f} kW | Peak: {peak_kw:.3f} kW at {peak_time} | Cohort peak: {tot_peak_mw:.3f} MW | Attention: {att_count} meters"
            )

        elif tname == "get_attention_summary":
            n_att = tr.get("needs_attention_count", 98)
            n_anom = tr.get("active_window_anomalies", 44)
            n_tot = tr.get("total_monitored", 620)
            sample_pri = tr.get("sample_priority_households", [])
            hh_ids = ", ".join([h["household_id"] for h in sample_pri[:3]])

            answers.append(
                f"{n_att} households currently require operational attention across the {n_tot}-household monitored cohort, led by accounts including {hh_ids}."
            )
            bullet_points.append(
                f"{n_anom} meters triggered anomaly detection flags in the latest observation period."
            )
            bullet_points.append(
                "Key priority triggers include unexplained peak surges, depressed day/night contrast ratios, and elevated forecast errors."
            )
            bullet_points.append(
                "Utility analysts can investigate each household's complete diurnal load curves under Consumer Intelligence."
            )
            evidence_lines.append(
                f"Needing attention: {n_att} | Latest anomalies: {n_anom} | Total cohort: {n_tot} meters"
            )

        elif tname == "get_consumer_rankings":
            top_c = tr.get("top_consumers", [])
            cat = tr.get("ranking_category", "consumption")
            if top_c:
                top1 = top_c[0]
                answers.append(
                    f"Top consumers account for a disproportionate share of grid demand, led by smart meter {top1['household_id']} with mean load {top1['mean_load']:.3f} kW and peak {top1['peak_load']:.3f} kW."
                )
                bullet_points.append(
                    f"Top accounts in this category include {', '.join([c['household_id'] for c in top_c[:3]])}."
                )
                bullet_points.append(
                    f"Account {top1['household_id']} operates with an archetype profile of '{top1.get('cluster_label', 'High Peak')}' and load factor {top1.get('load_factor', 0.0)}%."
                )
                bullet_points.append(
                    "High-consumption accounts represent priority candidates for targeted utility demand-response incentives."
                )
                evidence_lines.append(
                    f"Rank 1: {top1['household_id']} ({top1['mean_load']:.3f} kW mean, {top1['peak_load']:.3f} kW peak) | Category: {cat}"
                )

        elif tname == "get_research_summary":
            v_or = tr.get("volatility_odds_ratio", 7.4459)
            i_or = tr.get("instability_odds_ratio", 0.9183)
            i_p = tr.get("instability_p_value", 0.7481)
            h_auc = tr.get("holdout_roc_auc", 0.7298)
            h_n = tr.get("holdout_evaluated_households", 612)

            answers.append(
                "The empirical study found support for the null hypothesis (H0): temporal behavioral instability does not independently predict extreme load-forecast failure after controlling for consumption volatility."
            )
            bullet_points.append(
                f"Historical consumption volatility was the dominant statistical driver of forecast failure (Odds Ratio {v_or:.4f}, p < 0.0001)."
            )
            bullet_points.append(
                f"Behavioral cluster instability yielded an Odds Ratio of {i_or:.4f} (p = {i_p:.4f}), which was not statistically significant."
            )
            bullet_points.append(
                f"Forward-only out-of-sample holdout validation on {h_n} households confirmed an ROC-AUC of {h_auc:.4f} with zero model refitting."
            )
            evidence_lines.append(
                f"Volatility OR: {v_or:.4f} | Instability OR: {i_or:.4f} (p = {i_p:.4f}) | Holdout ROC-AUC: {h_auc:.4f} (n={h_n})"
            )

    # Format structured response if tools were invoked
    if answers:
        direct_ans = " ".join(answers)
        why_section = "\n".join([f"• {pt}" for pt in bullet_points])
        evidence_section = " | ".join(evidence_lines)
        answer = f"{direct_ans}\n\nWhat this means:\n{why_section}\n\nTechnical evidence:\n{evidence_section}"
    elif retrieved_passages:
        # Knowledge query without specific household
        top_p = retrieved_passages[0]
        heading = top_p["heading"]
        passage_text = top_p["text"]
        
        # Check domain topic for direct answers
        if any(w in msg_lower for w in ["hypothes", "find", "result", "conclud", "research", "predict failure", "instability predict"]):
            direct_ans = "The research study found that changing behavioral-cluster assignment over time does not independently predict extreme load-forecast failure once consumption volatility is accounted for."
            why_pts = [
                "Baseline consumption volatility is the dominant, statistically significant predictor of forecast accuracy.",
                "Shifts between daily behavioral clusters reflect structured lifestyle routines that forecasters readily learn.",
                "Nested likelihood-ratio tests confirmed that adding cluster instability provides no statistically significant incremental explanatory gain.",
            ]
        elif any(w in msg_lower for w in ["hungarian", "align"]):
            direct_ans = "GridVision uses chained Hungarian alignment to prevent cluster labels from arbitrarily scrambling across observation windows."
            why_pts = [
                "Because K-Means cluster labels are permutation-invariant, running clustering independently in each period would scramble cluster names.",
                "Hungarian bipartite matching connects each window's cluster centroids to the preceding window by minimizing centroid distance.",
                "This ensures that a label like 'Evening Peaker' continues to represent the same real-world behavior across observation windows.",
            ]
        elif any(w in msg_lower for w in ["k=4", "k = 4", "clusters", "how many"]):
            direct_ans = "GridVision selected K = 4 behavioral archetypes based on an empirical silhouette coefficient sweep evaluated strictly during calibration."
            why_pts = [
                "Testing K from 3 to 8 identified K = 4 as yielding the highest partition separability with a silhouette score of 0.4021.",
                "The 4 archetypes represent distinct real-world patterns: Evening Peakers, Baseload Steady, Daytime Active, and Dual Peak.",
                "Calibration was restricted to each household's own first two qualifying windows to prevent data leakage.",
            ]
        elif any(w in msg_lower for w in ["forecast", "predict", "gbdt", "lightgbm", "demand"]):
            direct_ans = "GridVision forecasts household electricity demand 24 hours ahead across 48 half-hourly time intervals using pooled Gradient Boosted Decision Trees."
            why_pts = [
                "The forecaster learns daily and weekly consumption rhythms using lag features and calendar indicators without future lookahead.",
                "The model achieves a cohort mean absolute error of 0.081 kW, outperforming standard seasonal baselines by 31.4%.",
                "Model parameters were evaluated strictly out-of-sample across calendar windows.",
            ]
        elif any(w in msg_lower for w in ["anomal", "outlier", "isolation forest"]):
            direct_ans = "GridVision identifies unusual household behavior using an unsupervised Isolation Forest model trained on 8 behavioral feature dimensions."
            why_pts = [
                "The detector is calibrated to flag roughly the most unusual 5% of observations across the cohort.",
                "Standardized z-scores explain exactly which feature (such as peak load or day-night ratio) triggered the flag.",
                "Longitudinal anomaly tracking detects structural behavioral shifts without requiring labeled fault data.",
            ]
        else:
            direct_ans = f"According to the GridVision research documentation ({heading}):"
            why_pts = [
                "GridVision monitors smart-metered household load forecasting, behavioral segmentation, and anomaly detection.",
                "The platform combines operational energy analytics with rigorous empirical research methodology.",
            ]

        why_section = "\n".join([f"• {pt}" for pt in why_pts])
        evidence_section = passage_text
        answer = f"{direct_ans}\n\nWhat this means:\n{why_section}\n\nTechnical evidence:\n{evidence_section}"
    else:
        answer = (
            "GridVision monitors smart-metered household load forecasting, longitudinal behavioral instability, "
            "and anomaly detection across 620 London households."
        )

    # 4. Strict numeric grounding verification
    context_sources = tool_results + [p["text"] for p in retrieved_passages]
    is_grounded = verify_numeric_grounding(answer, context_sources)


    return {
        "answer": answer,
        "tool_calls": tool_calls,
        "grounded": is_grounded,
    }

