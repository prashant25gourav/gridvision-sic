"""Unit and integration tests for GridVision Person 3: Anomaly Detection & SHAP Explainability."""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from pipeline.config import get_project_root, get_artifacts_dir
from pipeline.anomaly.explain import (
    BEHAVIORAL_FEATURE_COLS,
    compute_feature_baselines,
    explain_anomaly_row,
)
from pipeline.anomaly.isolation_forest import fit_anomaly_detector, detect_behavioral_anomalies
from pipeline.anomaly.synthetic_injection import inject_synthetic_anomalies, evaluate_synthetic_benchmark


@pytest.fixture(scope="module")
def artifacts_dir():
    root = get_project_root()
    p = root / "data" / "artifacts" / "latest"
    if not p.exists():
        pytest.skip("data/artifacts/latest does not exist")
    return p


def test_anomaly_flags_artifact_schema(artifacts_dir):
    """Verify anomaly_flags.parquet schema and constraints (Blueprint v2 §C/§F.5)."""
    path = artifacts_dir / "anomaly_flags.parquet"
    assert path.exists(), "anomaly_flags.parquet not found"

    df = pd.read_parquet(path)
    expected_cols = [
        "household_id",
        "window_id",
        "window_role",
        "is_anomaly",
        "anomaly_score",
        "triggering_statistic",
        "value",
        "baseline_mean",
        "baseline_std",
        "z_score",
        "severity",
        "explanation",
    ]
    for col in expected_cols:
        assert col in df.columns, f"Missing column: {col}"

    assert len(df) > 0
    assert df["household_id"].nunique() == 620
    assert df["is_anomaly"].dtype == bool
    assert df.isnull().sum().sum() == 0

    # Severity values check
    valid_severities = {"normal", "low", "medium", "high"}
    assert set(df["severity"].unique()).issubset(valid_severities)

    # Anomaly rate nominal check (~5%)
    anom_rate = df["is_anomaly"].mean()
    assert 0.01 <= anom_rate <= 0.15


def test_feature_based_explanation_logic():
    """Verify that explain_anomaly_row correctly identifies the maximum deviation feature."""
    row = pd.Series({
        "mean_load": 1.0,
        "peak_load": 8.0,  # Extreme spike
        "peak_to_average_ratio": 2.0,
        "std_load": 0.5,
        "ramp_rate_mean": 0.3,
        "day_night_ratio": 1.2,
        "weekday_weekend_contrast": 1.0,
        "peak_timing": 38.0,
    })

    hh_baselines = {
        col: {"mean": 1.0, "std": 0.5} for col in BEHAVIORAL_FEATURE_COLS
    }
    # Realistic peak timing baseline slot
    hh_baselines["peak_timing"] = {"mean": 38.0, "std": 3.0}
    # peak_load z-score = (8.0 - 1.0) / 0.5 = 14.0 > peak_timing (0.0)

    expl = explain_anomaly_row(row, hh_baselines, anomaly_score=-0.20)
    assert expl["triggering_statistic"] == "peak_load"
    assert expl["value"] == 8.0
    assert expl["z_score"] >= 10.0
    assert expl["severity"] == "high"
    assert "Elevated Peak Load" in expl["explanation"]


def test_synthetic_injection_framework():
    """Verify synthetic injection generates 4 distinct anomaly patterns and ground truth."""
    # Synthetic mock features
    mock_features = pd.DataFrame({
        "household_id": [f"HH_{i:03d}" for i in range(50)],
        "window_id": ["W03"] * 50,
        "mean_load": [1.0] * 50,
        "peak_load": [2.5] * 50,
        "peak_to_average_ratio": [2.5] * 50,
        "std_load": [0.6] * 50,
        "ramp_rate_mean": [0.4] * 50,
        "day_night_ratio": [1.2] * 50,
        "weekday_weekend_contrast": [1.0] * 50,
        "peak_timing": [38.0] * 50,
    })

    combined_df, y_true, anomaly_types = inject_synthetic_anomalies(
        mock_features, n_anomalies=16, random_state=42
    )

    assert len(combined_df) == len(mock_features) + 16
    assert int(y_true.sum()) == 16
    synthetic_types = set(combined_df[combined_df["is_synthetic_anomaly"]]["anomaly_type"])
    assert synthetic_types == {"extreme_spike", "prolonged_drop", "day_night_inversion", "erratic_volatility"}


def test_anomaly_benchmark_artifact(artifacts_dir):
    """Verify anomaly_benchmark.json schema and performance."""
    path = artifacts_dir / "anomaly_benchmark.json"
    assert path.exists(), "anomaly_benchmark.json not found"

    with open(path, "r", encoding="utf-8") as f:
        res = json.load(f)

    assert "performance_metrics" in res
    assert "recall_by_anomaly_type" in res
    assert res["performance_metrics"]["recall"] >= 0.70
    assert res["performance_metrics"]["roc_auc"] >= 0.80
    assert res["status"] == "PASSED"


def test_shap_explanations_artifact(artifacts_dir):
    """Verify shap_explanations.parquet schema and global forecaster scoping (Blueprint v2 §C)."""
    path = artifacts_dir / "shap_explanations.parquet"
    assert path.exists(), "shap_explanations.parquet not found"

    df = pd.read_parquet(path)
    expected_cols = [
        "household_id",
        "window_id",
        "slot_index",
        "day",
        "half_hour",
        "actual",
        "predicted",
        "trained_up_to_window",
        "base_value",
        "shap_half_hour",
        "shap_day_of_week",
        "shap_is_weekend",
        "shap_mean_load",
        "shap_peak_load",
        "shap_std_load",
        "top_feature",
    ]
    for col in expected_cols:
        assert col in df.columns, f"Missing column: {col}"

    assert len(df) > 0
    assert df["household_id"].nunique() == 620
    assert df.isnull().sum().sum() == 0

    # Leakage check: trained_up_to_window < window_id
    assert (df["trained_up_to_window"] < df["window_id"]).all()

    # Valid top features
    valid_features = {"half_hour", "day_of_week", "is_weekend", "mean_load", "peak_load", "std_load"}
    assert set(df["top_feature"].unique()).issubset(valid_features)

