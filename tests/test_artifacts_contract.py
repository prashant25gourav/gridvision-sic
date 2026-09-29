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

    # Strata breakdown
    counts = df["acorn_grouped"].value_counts().to_dict()
    assert counts.get("Affluent") == 237
    assert counts.get("Adversity") == 211
    assert counts.get("Comfortable") == 167
    assert counts.get("ACORN-U") == 5


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
