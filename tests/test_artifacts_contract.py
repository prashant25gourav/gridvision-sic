"""Integration tests verifying generated artifacts against Blueprint v2 and Contract §3."""

from pathlib import Path
import pandas as pd
import pytest
from pipeline.config import get_project_root


@pytest.fixture(scope="module")
def artifacts_dir():
    root = get_project_root()
    p = root / "data" / "artifacts" / "latest"
    if not p.exists():
        pytest.skip("data/artifacts/latest does not exist")
    return p


def test_window_eligibility_artifact(artifacts_dir):
    """Verify window_eligibility.parquet schema and constraints."""
    path = artifacts_dir / "window_eligibility.parquet"
    assert path.exists()

    df = pd.read_parquet(path)
    expected_cols = ["household_id", "window_id", "slot_fill_pct", "max_gap_days", "is_usable"]
    for col in expected_cols:
        assert col in df.columns

    # Verify 14 windows exactly per household
    hh_window_counts = df.groupby("household_id")["window_id"].count()
    assert (hh_window_counts == 14).all()

    # Verify qualifying pool count (>= 6 usable windows) is exactly 4,252
    usable_counts = df.groupby("household_id")["is_usable"].sum()
    qualifying_count = (usable_counts >= 6).sum()
    assert qualifying_count == 4252


def test_households_sampled_artifact(artifacts_dir):
    """Verify households_sampled.parquet schema and stratification."""
    path = artifacts_dir / "households_sampled.parquet"
    assert path.exists()

    df = pd.read_parquet(path)
    assert len(df) == 620
    expected_cols = ["household_id", "acorn_grouped", "n_usable_windows", "sample_seed"]
    for col in expected_cols:
        assert col in df.columns

    assert df["household_id"].nunique() == 620
    assert (df["sample_seed"] == 42).all()
    assert (df["n_usable_windows"] >= 6).all()

    # Strata breakdown (with ACORN-U protected floor = 15 per Issue 4 / DEC-013)
    counts = df["acorn_grouped"].value_counts().to_dict()
    assert counts.get("Affluent") == 233
    assert counts.get("Adversity") == 207
    assert counts.get("Comfortable") == 165
    assert counts.get("ACORN-U") == 15


def test_calibration_assignment_artifact(artifacts_dir):
    """Verify calibration_assignment.parquet schema and constraints."""
    path = artifacts_dir / "calibration_assignment.parquet"
    assert path.exists()

    df = pd.read_parquet(path)
    assert len(df) == 620
    expected_cols = [
        "household_id",
        "calibration_window_1",
        "calibration_window_2",
        "first_analysis_window",
        "last_usable_window",
        "n_analysis_windows",
    ]
    for col in expected_cols:
        assert col in df.columns

    # Every household must have >= 4 analysis windows
    assert (df["n_analysis_windows"] >= 4).all()

    # Verify no NaN
    assert df.isnull().sum().sum() == 0


def test_cross_artifact_household_consistency(artifacts_dir):
    """Verify no orphaned household IDs across artifacts."""
    sampled_df = pd.read_parquet(artifacts_dir / "households_sampled.parquet")
    cal_df = pd.read_parquet(artifacts_dir / "calibration_assignment.parquet")
    elig_df = pd.read_parquet(artifacts_dir / "window_eligibility.parquet")

    sampled_ids = set(sampled_df["household_id"])
    cal_ids = set(cal_df["household_id"])
    elig_ids = set(elig_df["household_id"])

    assert sampled_ids == cal_ids
    assert sampled_ids.issubset(elig_ids)


def test_forecast_global_artifact(artifacts_dir):
    """Verify forecast_global.parquet schema and Gate G5 leakage check."""
    path = artifacts_dir / "forecast_global.parquet"
    assert path.exists()

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
    ]
    for col in expected_cols:
        assert col in df.columns

    # Gate G5 leakage check: trained_up_to_window < window_id
    assert (df["trained_up_to_window"] < df["window_id"]).all()
    assert (df["predicted"] >= 0.0).all()


def test_research_table_artifact(artifacts_dir):
    """Verify research_table.parquet schema, adjacency, and holdout constraints."""
    from pipeline.windows.calendar import calendar_successor

    path = artifacts_dir / "research_table.parquet"
    assert path.exists()

    df = pd.read_parquet(path)
    expected_cols = [
        "household_id",
        "window_w",
        "window_w_plus_1",
        "instability",
        "volatility_cv",
        "ae",
        "std_error",
        "is_extreme_failure",
        "acorn_grouped",
        "is_holdout",
    ]
    for col in expected_cols:
        assert col in df.columns

    # No nulls anywhere in the table
    assert df.isnull().sum().sum() == 0

    # Adjacency check: window_w_plus_1 must be the literal calendar successor of window_w
    for _, row in df.iterrows():
        assert calendar_successor(row["window_w"]) == row["window_w_plus_1"]

    # At most 1 holdout row per household
    holdout_counts = df[df["is_holdout"]].groupby("household_id").size()
    assert (holdout_counts == 1).all()

    # Analysis rows and holdout rows both present
    assert (df["is_holdout"] == False).sum() > 3000
    assert (df["is_holdout"] == True).sum() >= 600


def test_statistical_results_artifact(artifacts_dir):
    """Verify statistical_results.json schema, G6 gate check, and H1/H0 verdict."""
    import json
    path = artifacts_dir / "statistical_results.json"
    assert path.exists()

    with open(path, "r", encoding="utf-8") as f:
        res = json.load(f)

    assert "sample" in res
    assert "gate_g6_check" in res
    assert "hypothesis_h1_result" in res
    assert "nested_model_comparison_h3" in res
    assert "primary_model" in res
    assert "restricted_model" in res

    assert res["gate_g6_check"]["gate_status"] == "PASSED"
    assert res["sample"]["n_observations"] > 3000
    assert res["sample"]["cov_type"] == "cluster"
    assert res["sample"]["cluster_variable"] == "household_id"
    assert res["hypothesis_h1_result"]["verdict"] in ["SUPPORTED", "NOT_SUPPORTED"]


def test_holdout_results_artifact(artifacts_dir):
    """Verify holdout_results.json schema and Gate G7 forward-only protocol."""
    import json
    path = artifacts_dir / "holdout_results.json"
    assert path.exists()

    with open(path, "r", encoding="utf-8") as f:
        res = json.load(f)

    assert res["holdout_protocol"]["forward_only"] is True
    assert res["holdout_protocol"]["refit_performed"] is False
    assert res["status"] == "COMPLETED"
    assert res["sample"]["eligible_holdout_evaluated"] >= 600


def test_forecast_percluster_artifact(artifacts_dir):
    """Verify forecast_percluster.parquet schema and cluster_id column."""
    path = artifacts_dir / "forecast_percluster.parquet"
    assert path.exists()

    df = pd.read_parquet(path)
    expected_cols = [
        "household_id",
        "window_id",
        "slot_index",
        "day",
        "half_hour",
        "actual",
        "predicted",
        "cluster_id",
        "trained_up_to_window",
    ]
    for col in expected_cols:
        assert col in df.columns

    assert (df["trained_up_to_window"] < df["window_id"]).all()
    assert (df["predicted"] >= 0.0).all()


