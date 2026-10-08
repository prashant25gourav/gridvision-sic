"""Tests for behavioral feature extraction (P1)."""

import numpy as np
import pandas as pd
import pytest
from pipeline.features.behavioral import extract_features_from_window_readings
from pipeline.config import get_artifacts_dir


def test_extract_features_synthetic_constant():
    """Verify feature values for a constant flat load curve."""
    mat = np.ones((56, 48), dtype=float) * 0.5
    weekday_mask = np.ones(56, dtype=bool)

    feats = extract_features_from_window_readings(mat, weekday_mask)

    assert pytest.approx(feats["mean_load"], rel=1e-3) == 0.5
    assert pytest.approx(feats["peak_load"], rel=1e-3) == 0.5
    assert pytest.approx(feats["peak_to_average_ratio"], rel=1e-3) == 1.0
    assert pytest.approx(feats["std_load"], abs=1e-4) == 0.0
    assert pytest.approx(feats["ramp_rate_mean"], abs=1e-4) == 0.0
    assert pytest.approx(feats["day_night_ratio"], rel=1e-3) == 1.0


def test_extract_features_with_nans_interpolation():
    """Verify that isolated NaNs are smoothly interpolated without producing NaN features."""
    mat = np.ones((56, 48), dtype=float) * 0.5
    mat[5, 10:15] = np.nan
    mat[12, 0:2] = np.nan
    weekday_mask = np.array([True] * 40 + [False] * 16)

    feats = extract_features_from_window_readings(mat, weekday_mask)

    for k, v in feats.items():
        assert not np.isnan(v), f"Feature {k} returned NaN!"
        assert not np.isinf(v), f"Feature {k} returned Inf!"


def test_behavioral_features_artifact_contract():
    """Verify that behavioral_features.parquet adheres to schema and expected shape."""
    latest = get_artifacts_dir("latest")
    bf_path = latest / "behavioral_features.parquet"
    if not bf_path.exists():
        pytest.skip("behavioral_features.parquet not yet generated")

    df = pd.read_parquet(bf_path)
    assert len(df) > 5000  # ~6,198 rows expected

    expected_cols = [
        "household_id", "window_id", "mean_load", "peak_load",
        "peak_to_average_ratio", "std_load", "ramp_rate_mean",
        "day_night_ratio", "weekday_weekend_contrast", "peak_timing"
    ]
    for col in expected_cols:
        assert col in df.columns

    # Verify no NaN across entire table
    assert df.isnull().sum().sum() == 0

    # Verify every household has at least 6 usable windows (including calibration)
    counts = df.groupby("household_id")["window_id"].count()
    assert (counts >= 6).all()
