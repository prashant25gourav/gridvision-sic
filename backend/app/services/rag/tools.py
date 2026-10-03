"""RAG Copilot Tools (P4).

Implements deterministic tool functions bound to pipeline artifacts matching Blueprint v2 §F/§H.
These tools are callable by the Copilot service to retrieve factual household metrics.

Locked Rules (Blueprint v2 §H, Handoff §11):
- What the Copilot IS allowed to do: retrieve precomputed metrics via tools.
- What the Copilot is NOT allowed to do: recompute ML models, forecasts, or clusters dynamically.
"""

from typing import Any, Dict, Optional
from app.services.artifact_loader import store


def get_forecast(household_id: str, window_id: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve demand forecast metrics, MAE, and SHAP top features for a household."""
    res = store.get_household_forecast(household_id, window_id=window_id)
    if not res:
        return {
            "error": f"No forecast data found for household {household_id}" + (f" in window {window_id}" if window_id else ""),
            "household_id": household_id,
        }
    return {
        "household_id": res["household_id"],
        "window_id": res["window_id"],
        "mae_global": res["mae_global"],
        "mae_percluster": res["mae_percluster"],
        "shap_top_features": res["shap_top_features"][:4],
        "sample_points_count": len(res["series"]),
    }


def get_segment(household_id: str) -> Dict[str, Any]:
    """Retrieve behavioral cluster segmentation history and current cluster assignment."""
    res = store.get_household_segment(household_id)
    if not res:
        return {
            "error": f"No segmentation data found for household {household_id}",
            "household_id": household_id,
        }
    return {
        "household_id": res["household_id"],
        "current_cluster_id": res["current_cluster_id"],
        "current_cluster_label": res["current_cluster_label"],
        "trajectory_windows_count": len(res["trajectory"]),
        "recent_trajectory": res["trajectory"][-4:],
    }


def get_instability(household_id: str) -> Dict[str, Any]:
    """Retrieve longitudinal cluster instability score, volatility CV, and reliability tier."""
    res = store.get_household_instability(household_id)
    if not res:
        return {
            "error": f"No instability data found for household {household_id}",
            "household_id": household_id,
        }
    latest_pt = res["series"][-1] if res["series"] else {}
    return {
        "household_id": res["household_id"],
        "latest_window": latest_pt.get("window_id", "N/A"),
        "instability": latest_pt.get("instability", 0.0),
        "volatility_cv": latest_pt.get("volatility_cv", 0.0),
        "reliability_indicator": res["reliability_indicator"],
        "history": res["series"][-4:],
    }


def get_anomaly(household_id: str) -> Dict[str, Any]:
    """Retrieve Isolation Forest anomaly status, triggering feature statistics, and explanations."""
    res = store.get_household_anomaly(household_id)
    if not res:
        return {
            "error": f"No anomaly records found for household {household_id}",
            "household_id": household_id,
        }
    anom_flags = [f for f in res["flags"] if f["is_anomaly"]]
    latest_flag = res["flags"][-1] if res["flags"] else {}
    return {
        "household_id": res["household_id"],
        "total_windows_evaluated": len(res["flags"]),
        "total_anomalies_flagged": len(anom_flags),
        "latest_window": latest_flag.get("window_id", "N/A"),
        "is_currently_anomalous": latest_flag.get("is_anomaly", False),
        "latest_triggering_statistic": latest_flag.get("triggering_statistic", "normal"),
        "latest_severity": latest_flag.get("severity", "normal"),
        "latest_explanation": latest_flag.get("explanation", ""),
        "active_anomalies": anom_flags[-3:],
    }
