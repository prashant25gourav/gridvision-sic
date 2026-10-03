"""Household Endpoints (P4).

Implements:
- GET /household/{household_id}/forecast  (Blueprint v2 §F.2)
- GET /household/{household_id}/segment   (Blueprint v2 §F.3)
- GET /household/{household_id}/instability (Blueprint v2 §F.4)
- GET /household/{household_id}/anomaly   (Blueprint v2 §F.5)
- GET /households (Portfolio list for UI search and dropdowns)
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.artifact_loader import store

router = APIRouter()


@router.get("/households")
def list_households():
    """Return all sampled households with metadata, current cluster, and reliability status."""
    return store.get_households_summary()


@router.get("/household/{household_id}/forecast")
def get_forecast_endpoint(
    household_id: str,
    window_id: Optional[str] = Query(None, description="Optional target calendar window (defaults to latest)"),
):
    """Retrieve half-hourly forecast series, MAE metrics, and top SHAP feature attributions."""
    known = store.get_known_households()
    if known and household_id not in known:
        raise HTTPException(status_code=404, detail=f"Household '{household_id}' not found in study sample.")

    res = store.get_household_forecast(household_id, window_id=window_id)
    if not res:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast available for household '{household_id}'" + (f" in window {window_id}" if window_id else ""),
        )
    return res


@router.get("/household/{household_id}/segment")
def get_segment_endpoint(household_id: str):
    """Retrieve behavioral cluster assignment trajectory and current cluster classification."""
    known = store.get_known_households()
    if known and household_id not in known:
        raise HTTPException(status_code=404, detail=f"Household '{household_id}' not found in study sample.")

    res = store.get_household_segment(household_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"No segment data for household '{household_id}'.")
    return res


@router.get("/household/{household_id}/instability")
def get_instability_endpoint(household_id: str):
    """Retrieve longitudinal cluster instability series and reliability indicator tier."""
    known = store.get_known_households()
    if known and household_id not in known:
        raise HTTPException(status_code=404, detail=f"Household '{household_id}' not found in study sample.")

    res = store.get_household_instability(household_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"No instability records for household '{household_id}'.")
    return res


@router.get("/household/{household_id}/anomaly")
def get_anomaly_endpoint(household_id: str):
    """Retrieve Isolation Forest anomaly flags, triggering statistics, and feature explanations."""
    known = store.get_known_households()
    if known and household_id not in known:
        raise HTTPException(status_code=404, detail=f"Household '{household_id}' not found in study sample.")

    res = store.get_household_anomaly(household_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"No anomaly records for household '{household_id}'.")
    return res
