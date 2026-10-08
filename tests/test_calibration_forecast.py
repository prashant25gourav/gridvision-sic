"""Tests for per-household calibration forecasting and isolation."""

import ast
from pathlib import Path
import numpy as np
import pandas as pd
import pytest
from pipeline.config import get_project_root, get_artifacts_dir
from pipeline.forecasting.calibration_forecast import calibrate_household, MAD_FLOOR_FACTOR


def test_static_import_isolation():
    """Verify that calibration_forecast.py does not import global_forecaster."""
    root = get_project_root()
    cal_file = root / "pipeline" / "forecasting" / "calibration_forecast.py"
    with open(cal_file, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=str(cal_file))

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                assert "global_forecaster" not in alias.name, "LEAKAGE: calibration_forecast imports global_forecaster!"
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                assert "global_forecaster" not in node.module, "LEAKAGE: calibration_forecast imports from global_forecaster!"


def test_calibrate_household_leakage_assertion():
    """Verify that passing data with multiple household IDs raises ValueError."""
    cal_w1_dirty = pd.DataFrame({
        "household_id": ["HH_01", "HH_02"],
        "half_hour": [0, 1],
        "day_of_week": [0, 0],
        "is_weekend": [0, 0],
        "actual": [0.5, 0.6],
    })
    cal_w2 = pd.DataFrame({
        "household_id": ["HH_01", "HH_01"],
        "window_id": ["W02", "W02"],
        "slot_index": [0, 1],
        "half_hour": [0, 1],
        "day_of_week": [0, 0],
        "is_weekend": [0, 0],
        "actual": [0.5, 0.6],
    })

    with pytest.raises(ValueError, match="LEAKAGE VIOLATION"):
        calibrate_household("HH_01", cal_w1_dirty, cal_w2)


def test_mad_floor_trigger():
    """Verify that households with near-zero MAD trigger the MAD floor."""
    # Constant actuals -> perfect predictions -> zero residuals
    cal_w1 = pd.DataFrame({
        "household_id": ["HH_CONST"] * 48,
        "half_hour": list(range(48)),
        "day_of_week": [0] * 48,
        "is_weekend": [0] * 48,
        "actual": [1.0] * 48,
    })
    cal_w2 = pd.DataFrame({
        "household_id": ["HH_CONST"] * 48,
        "window_id": ["W02"] * 48,
        "slot_index": list(range(48)),
        "half_hour": list(range(48)),
        "day_of_week": [0] * 48,
        "is_weekend": [0] * 48,
        "actual": [1.05] * 48,  # constant offset 0.05
    })

    residuals_df, summary = calibrate_household("HH_CONST", cal_w1, cal_w2)

    assert summary["calibration_median_ae"] == pytest.approx(0.05, abs=1e-3)
    # MAD of constant [0.05, 0.05, ...] is 0.0
    assert summary["calibration_mad"] == 0.0
    # MAD effective floor = 0.05 * 0.05 = 0.0025
    assert summary["mad_effective"] == pytest.approx(0.05 * summary["calibration_median_ae"], rel=1e-3)
    assert summary["mad_floor_triggered"] is True
