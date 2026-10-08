"""Integration tests for GridVision FastAPI backend and RAG Copilot.

Validates:
- API endpoint contracts (/overview, /household/..., /chat)
- 404 error handling for unknown households
- Tool execution and numeric traceability grounding checks
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in python path
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / "backend"))

from app.main import app
from app.services.artifact_loader import store
from app.services.rag.grounding import verify_numeric_grounding


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_health_check(client):
    """Verify health endpoint."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_overview_endpoint(client):
    """Verify GET /overview schema."""
    res = client.get("/overview")
    assert res.status_code == 200
    data = res.json()

    assert "n_households" in data
    assert data["n_households"] == 620
    assert "n_active_anomalies" in data
    assert "cluster_distribution" in data
    assert len(data["cluster_distribution"]) == 4
    for item in data["cluster_distribution"]:
        assert "cluster_id" in item
        assert "count" in item
        assert "label" in item
    assert "last_pipeline_run" in data

    # Also verify /api/v1/overview
    res_v1 = client.get("/api/v1/overview")
    assert res_v1.status_code == 200
    assert res_v1.json()["n_households"] == 620


def test_households_list_endpoint(client):
    """Verify GET /households returns all 620 households."""
    res = client.get("/households")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 620

    first = data[0]
    expected_keys = [
        "household_id",
        "acorn_grouped",
        "cluster_id",
        "cluster_label",
        "instability",
        "volatility_cv",
        "reliability_indicator",
        "anomaly_count",
    ]
    for k in expected_keys:
        assert k in first
    assert first["reliability_indicator"] in ["stable", "moderate", "elevated_risk"]


def test_household_segment_endpoint(client):
    """Verify GET /household/{id}/segment schema."""
    known_hhs = store.get_known_households()
    assert len(known_hhs) > 0
    test_hh = known_hhs[0]

    res = client.get(f"/household/{test_hh}/segment")
    assert res.status_code == 200
    data = res.json()
    assert data["household_id"] == test_hh
    assert "trajectory" in data
    assert len(data["trajectory"]) >= 6
    assert "current_cluster_id" in data
    assert "current_cluster_label" in data

    # Verify 404 for unknown household
    res_404 = client.get("/household/NON_EXISTENT_HH/segment")
    assert res_404.status_code == 404


def test_household_instability_endpoint(client):
    """Verify GET /household/{id}/instability schema."""
    known_hhs = store.get_known_households()
    test_hh = known_hhs[0]

    res = client.get(f"/household/{test_hh}/instability")
    assert res.status_code == 200
    data = res.json()
    assert data["household_id"] == test_hh
    assert "series" in data
    assert len(data["series"]) >= 4
    for pt in data["series"]:
        assert "window_id" in pt
        assert "instability" in pt
        assert "volatility_cv" in pt
        assert "reliability" in pt
    assert data["reliability_indicator"] in ["stable", "moderate", "elevated_risk"]

    # Verify 404 for unknown household
    res_404 = client.get("/household/NON_EXISTENT_HH/instability")
    assert res_404.status_code == 404


def test_household_anomaly_endpoint(client):
    """Verify GET /household/{id}/anomaly schema."""
    known_hhs = store.get_known_households()
    test_hh = known_hhs[0]

    res = client.get(f"/household/{test_hh}/anomaly")
    assert res.status_code == 200
    data = res.json()
    assert data["household_id"] == test_hh
    assert "flags" in data
    assert len(data["flags"]) >= 6
    for f in data["flags"]:
        assert "window_id" in f
        assert "is_anomaly" in f
        assert "triggering_statistic" in f
        assert "severity" in f
        assert "explanation" in f

    # Verify 404 for unknown household
    res_404 = client.get("/household/NON_EXISTENT_HH/anomaly")
    assert res_404.status_code == 404


def test_household_forecast_endpoint(client):
    """Verify GET /household/{id}/forecast schema."""
    known_hhs = store.get_known_households()
    test_hh = known_hhs[0]

    res = client.get(f"/household/{test_hh}/forecast")
    assert res.status_code == 200
    data = res.json()
    assert data["household_id"] == test_hh
    assert "window_id" in data
    assert "series" in data
    assert len(data["series"]) > 0
    assert "mae_global" in data
    assert "mae_percluster" in data
    assert "shap_top_features" in data
    assert len(data["shap_top_features"]) > 0

    first_pt = data["series"][0]
    assert "timestamp" in first_pt
    assert "actual" in first_pt
    assert "predicted_global" in first_pt
    assert "predicted_percluster" in first_pt

    # Verify 404 for unknown household
    res_404 = client.get("/household/NON_EXISTENT_HH/forecast")
    assert res_404.status_code == 404


def test_copilot_chat_endpoint(client):
    """Verify POST /chat endpoint."""
    known_hhs = store.get_known_households()
    test_hh = known_hhs[0]

    payload = {
        "message": f"Why is household {test_hh} flagged as unreliable?",
        "household_id": test_hh,
    }
    res = client.post("/chat", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "answer" in data
    assert "tool_calls" in data
    assert "grounded" in data
    assert len(data["answer"]) > 10
    assert data["grounded"] is True
    assert any(tc["tool"] == "get_instability" for tc in data["tool_calls"])


def test_numeric_grounding_enforcement():
    """Verify strict numeric traceability check downgrades hallucinated numbers."""
    context = [
        {"instability": 0.33, "volatility_cv": 0.51, "household_id": "MAC000123"},
        "Threshold fixed at 2.5804 for extreme failures.",
    ]

    # Grounded answer: only uses numbers from context
    grounded_answer = "Household MAC000123 had instability 0.33 and volatility 0.51, below threshold 2.5804."
    assert verify_numeric_grounding(grounded_answer, context) is True

    # Hallucinated answer: invents 0.89 and 99.4
    hallucinated_answer = "The instability was 0.89 and model confidence was 99.4%."
    assert verify_numeric_grounding(hallucinated_answer, context) is False


def test_analytics_endpoints(client):
    """Verify precomputed research and analytics endpoints."""
    # 1. Research findings
    res_f = client.get("/research/findings")
    assert res_f.status_code == 200
    f_data = res_f.json()
    assert "statistical_results" in f_data
    assert "holdout_results" in f_data
    assert "extreme_failure_threshold" in f_data

    # 2. Segmentation overview
    res_s = client.get("/segmentation/overview")
    assert res_s.status_code == 200
    s_data = res_s.json()
    assert s_data["selected_k"] == 4
    assert len(s_data["clusters"]) == 4

    # 3. Anomalies overview
    res_a = client.get("/anomalies/overview")
    assert res_a.status_code == 200
    a_data = res_a.json()
    assert "real_anomalies" in a_data
    assert "synthetic_benchmark" in a_data

    # 4. Forecast summary
    res_fc = client.get("/forecast/summary")
    assert res_fc.status_code == 200
    fc_data = res_fc.json()
    assert "mae_global" in fc_data
    assert "representative_series" in fc_data
    assert len(fc_data["representative_series"]) == 48

