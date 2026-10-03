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
            # First match or nearest fallback if testing
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

        # Default fallback if question mentions household but no specific keyword
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

    # 2. Retrieve relevant domain passages from knowledge base
    retrieved_passages = retriever.retrieve(message, top_k=2)

    # 3. Assemble grounded response
    parts: List[str] = []

    # Synthesize from tool results
    for tc, tr in zip(tool_calls, tool_results):
        tname = tc["tool"]
        if "error" in tr:
            parts.append(tr["error"])
            continue

        if tname == "get_instability":
            inst_val = tr.get("instability", 0.0)
            vol_val = tr.get("volatility_cv", 0.0)
            rel = tr.get("reliability_indicator", "moderate")
            win = tr.get("latest_window", "latest window")
            parts.append(
                f"Household {active_hh}'s longitudinal instability score reached {inst_val:.3f} (volatility CV: {vol_val:.3f}) in {win}, placing it in the '{rel}' reliability tier."
            )
        elif tname == "get_forecast":
            mae_g = tr.get("mae_global", 0.0)
            mae_pc = tr.get("mae_percluster", mae_g)
            win = tr.get("window_id", "")
            top_feats = tr.get("shap_top_features", [])
            feat_desc = ", ".join([f"{f['feature']} ({f['contribution']:.4f})" for f in top_feats[:2]])
            parts.append(
                f"In {win}, the global forecaster recorded an MAE of {mae_g:.4f} kWh (per-cluster forecaster MAE: {mae_pc:.4f} kWh). Key SHAP predictive features include {feat_desc}."
            )
        elif tname == "get_segment":
            cid = tr.get("current_cluster_id", 0)
            clabel = tr.get("current_cluster_label", f"Cluster {cid}")
            n_trans = tr.get("trajectory_windows_count", 0)
            parts.append(
                f"Household {active_hh} is currently classified under Cluster {cid} ('{clabel}') across {n_trans} observed calendar windows."
            )
        elif tname == "get_anomaly":
            n_anom = tr.get("total_anomalies_flagged", 0)
            is_anom = tr.get("is_currently_anomalous", False)
            if is_anom:
                trig = tr.get("latest_triggering_statistic", "behavioral deviation")
                expl = tr.get("latest_explanation", "")
                parts.append(
                    f"Household {active_hh} has {n_anom} total anomaly flags recorded. In the latest window, an anomaly was triggered by {trig}: {expl}"
                )
            else:
                parts.append(
                    f"Household {active_hh} has {n_anom} total past anomaly flags and is operating within normal baseline limits in the latest window."
                )

    # If no tool calls (general knowledge query), answer from retrieved knowledge base
    if not parts and retrieved_passages:
        for p in retrieved_passages:
            parts.append(f"From {p['heading']}: {p['text']}")

    if not parts:
        parts.append(
            "GridVision monitors smart-metered household load forecasting, longitudinal behavioral instability, and anomaly detection across 620 London households."
        )

    answer = " ".join(parts)

    # 4. Strict numeric grounding verification
    context_sources = tool_results + [p["text"] for p in retrieved_passages]
    is_grounded = verify_numeric_grounding(answer, context_sources)

    return {
        "answer": answer,
        "tool_calls": tool_calls,
        "grounded": is_grounded,
    }
