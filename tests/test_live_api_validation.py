import urllib.request
import json
import pytest

BASE_URL = "http://127.0.0.1:8000/api/v1"


def get_json(endpoint: str):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))


def test_demand_snapshot_endpoint():
    data = get_json("/overview/grid")
    assert "total_consumption_mwh" in data
    assert "diurnal_profile" in data
    assert len(data["diurnal_profile"]) == 48
    assert "demand_change" in data
    assert "alerts" in data


def test_demand_analysis_endpoint():
    data = get_json("/demand/analysis")
    assert "diurnal_profile" in data
    assert len(data["diurnal_profile"]) == 48
    assert "weekday_vs_weekend" in data
    assert len(data["weekday_vs_weekend"]) == 48
    assert "windows" in data
    assert "window_trend" in data
    assert "seasonal_comparison" in data


def test_consumer_rankings_endpoint():
    data = get_json("/consumers/rankings")
    assert "all_consumers" in data
    assert len(data["all_consumers"]) > 500
    assert "summary" in data
    first = data["all_consumers"][0]
    assert "household_id" in first
    assert "peak_load" in first
    assert "forecast_mae" in first
    assert "anomaly_count" in first
    assert "instability" in first
    assert "load_factor" in first


def test_consumer_profile_endpoint():
    data = get_json("/consumers/MAC000045/profile")
    assert data["household_id"] == "MAC000045"
    assert "summary" in data
    assert "diurnal_profile" in data
    assert "diurnal_forecast" in data
    assert len(data["diurnal_forecast"]) > 0
    assert "explanation" in data


def test_anomalies_analysis_endpoint():
    data = get_json("/anomalies/analysis")
    assert "active_latest_window" in data
    assert "severity_breakdown" in data
    assert "affected_consumers" in data
    assert len(data["affected_consumers"]) > 0
    first = data["affected_consumers"][0]
    assert "household_id" in first
    assert "severity" in first
    assert "action" in first


def test_forecast_portal_endpoint():
    data = get_json("/forecast/portal")
    assert "cohort_peak_mw" in data
    assert "expected_demand_avg_kw" in data
    assert "diurnal_series" in data
    assert len(data["diurnal_series"]) == 48


def test_household_forecast_endpoint():
    data = get_json("/household/MAC000045/forecast")
    assert data["household_id"] == "MAC000045"
    assert "series" in data
    assert len(data["series"]) == 2688
    assert "mae_global" in data
    assert "shap_top_features" in data
    assert len(data["shap_top_features"]) > 0


def test_copilot_chat_queries():
    chat_url = f"{BASE_URL}/chat"
    queries = [
        {"message": "What is the current demand and peak load?", "household_id": None},
        {"message": "What is the day-ahead forecast for Consumer 045?", "household_id": "MAC000045"},
        {"message": "What cluster does Consumer 045 belong to?", "household_id": "MAC000045"},
        {"message": "Does Consumer 045 show any anomalies?", "household_id": "MAC000045"},
        {"message": "How does weekday demand compare with weekend demand?", "household_id": None},
    ]

    for q in queries:
        payload = json.dumps(q).encode("utf-8")
        req = urllib.request.Request(chat_url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            assert resp.status == 200
            res_data = json.loads(resp.read().decode("utf-8"))
            assert "answer" in res_data
            assert len(res_data["answer"]) > 10
            assert "grounded" in res_data
            assert res_data["grounded"] is True
            # Verified that either tool calls were made or RAG passages were retrieved
            tools_called = len(res_data.get("tool_calls", []))
            passages = len(res_data.get("debug", {}).get("retrieved_passages", []))
            assert tools_called > 0 or passages > 0
