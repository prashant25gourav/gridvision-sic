"""Analytics & Research Endpoints (P4 & Product Analytics).

Serves precomputed artifacts for Grid Overview, Demand Analysis,
Consumer Intelligence, Anomaly Analysis, Forecasting, and Research Findings.
"""

from fastapi import APIRouter, HTTPException
from app.services.artifact_loader import store

router = APIRouter()


@router.get("/overview/grid")
def get_grid_overview_endpoint():
    """Retrieve comprehensive grid operational overview and diurnal load profile."""
    return store.get_overview_data()


@router.get("/demand/analysis")
def get_demand_analysis_endpoint():
    """Retrieve full demand analysis: diurnal profile, weekday vs weekend, window trend, and seasonality."""
    return store.get_demand_analysis()


@router.get("/consumers/rankings")
def get_consumer_rankings_endpoint():
    """Retrieve consumer ranking tables, operational priorities, and attention status across all 620 homes."""
    return store.get_consumer_rankings()


@router.get("/consumers/{household_id}/profile")
def get_consumer_profile_endpoint(household_id: str):
    """Retrieve full single-consumer profile with consumption, trajectory, forecast, and anomaly history."""
    profile = store.get_household_full_profile(household_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Consumer '{household_id}' not found in study sample.")
    return profile


@router.get("/anomalies/analysis")
def get_anomalies_analysis_endpoint():
    """Retrieve operational anomaly analysis: timeline, severity breakdown, and action-oriented recent list."""
    return store.get_anomalies_analysis()


@router.get("/forecast/portal")
def get_forecast_portal_endpoint():
    """Retrieve product-first forecasting analytics: horizon, expected peak, error reduction, and reliability."""
    return store.get_forecast_portal()


@router.get("/research/findings")
def get_research_findings_endpoint():
    """Retrieve statistical logistic regression, holdout evaluation, and extreme failure threshold."""
    return store.get_research_findings()


@router.get("/segmentation/overview")
def get_segmentation_overview_endpoint():
    """Retrieve K-Means cluster profiles, silhouette sweep, and feature comparisons."""
    return store.get_segmentation_overview()


@router.get("/anomalies/overview")
def get_anomalies_overview_endpoint():
    """Retrieve Isolation Forest anomaly flags breakdown and synthetic injection benchmark."""
    return store.get_anomaly_overview()


@router.get("/forecast/summary")
def get_forecast_summary_endpoint():
    """Retrieve system forecasting metrics and cohort demand profile."""
    return store.get_forecast_summary_overview()
