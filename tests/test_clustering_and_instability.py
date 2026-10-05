"""Tests for clustering, Hungarian alignment, and instability metrics (P1)."""

import numpy as np
import pandas as pd
import pytest
from pipeline.clustering.alignment import align_household_trajectory
from pipeline.instability.metrics import compute_instability_and_volatility
from pipeline.config import get_artifacts_dir


def test_hungarian_alignment_synthetic_invariance():
    """Verify that a sequence of identical behavioral clusters with shuffled labels aligns to constant."""
    # 2 clusters in 2D space
    centroids_w1 = np.array([[1.0, 0.0], [-1.0, 0.0]])
    # w2 shuffled: raw label 0 is [-1, 0], raw label 1 is [1, 0]
    centroids_w2 = np.array([[-1.0, 0.0], [1.0, 0.0]])

    centroids = {"W01": centroids_w1, "W02": centroids_w2}

    # Household trajectory: in w1 raw=0 ([1,0]); in w2 raw=1 ([1,0]) -> underlying cluster is SAME
    hh_df = pd.DataFrame([
        {"household_id": "HH1", "window_id": "W01", "window_role": "calibration_1", "raw_cluster_label": 0},
        {"household_id": "HH1", "window_id": "W02", "window_role": "calibration_2", "raw_cluster_label": 1},
    ])

    aligned = align_household_trajectory(hh_df, centroids)
    assert aligned.loc[0, "aligned_cluster_label"] == 0
    assert aligned.loc[1, "aligned_cluster_label"] == 0  # Successfully aligned to 0!


def test_instability_first_analysis_transition_count():
    """Verify that the first Analysis window has n_transitions_observed == 2."""
    latest = get_artifacts_dir("latest")
    iv_path = latest / "instability_volatility.parquet"
    if not iv_path.exists():
        pytest.skip("instability_volatility.parquet not yet generated")

    df = pd.read_parquet(iv_path)
    assert len(df) == 4331  # exact analysis windows count for N=620 with ACORN-U floor 15

    first_rows = df.groupby("household_id").first()
    # Contract constraint: first Analysis window must observe 2 transitions (Cal1->Cal2, Cal2->Analysis1)
    assert (first_rows["n_transitions_observed"] == 2).all()

    # Persistence + Instability must equal 1.0
    sum_pi = (df["persistence"] + df["instability"]).round(4)
    assert (sum_pi == 1.0).all()

    # Volatility CV must be non-negative
    assert (df["volatility_cv"] >= 0).all()

    # No NaNs anywhere
    assert df.isnull().sum().sum() == 0


def test_cluster_assignments_artifact_contract():
    """Verify cluster_assignments.parquet schema and constraints."""
    latest = get_artifacts_dir("latest")
    ca_path = latest / "cluster_assignments.parquet"
    if not ca_path.exists():
        pytest.skip("cluster_assignments.parquet not yet generated")

    df = pd.read_parquet(ca_path)
    assert len(df) == 6191  # exact usable windows count for N=620 with ACORN-U floor 15

    expected_cols = [
        "household_id", "window_id", "window_role",
        "raw_cluster_label", "aligned_cluster_label", "centroid_distance"
    ]
    for col in expected_cols:
        assert col in df.columns

    # Verify all roles are present
    roles = set(df["window_role"].unique())
    assert roles == {"calibration_1", "calibration_2", "analysis", "holdout"}

    # Each household must have exactly 1 calibration_1, 1 calibration_2, 1 holdout
    for role in ["calibration_1", "calibration_2", "holdout"]:
        counts = df[df["window_role"] == role].groupby("household_id")["window_id"].count()
        assert len(counts) == 620
        assert (counts == 1).all()
