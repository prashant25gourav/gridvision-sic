"""Unit tests for Research Pipeline and Isolation rules."""

import ast
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from pipeline.config import get_project_root, get_artifacts_dir
from pipeline.windows.calendar import calendar_successor, calendar_predecessor
from pipeline.forecasting.error_standardization import standardize_error, label_extreme_failures


def test_static_isolation_research_table():
    """Verify build_research_table.py must NEVER import cluster_forecaster."""
    root = get_project_root()
    table_file = root / "pipeline" / "research" / "build_research_table.py"
    assert table_file.exists()

    with open(table_file, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=str(table_file))

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                assert "cluster_forecaster" not in alias.name, "LEAKAGE: build_research_table imports cluster_forecaster!"
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                assert "cluster_forecaster" not in node.module, "LEAKAGE: build_research_table imports from cluster_forecaster!"


def test_gate_g7_no_fit_in_holdout_eval():
    """Gate G7: holdout_eval.py must NEVER contain .fit( or .fit_predict( code calls."""
    root = get_project_root()
    holdout_file = root / "pipeline" / "research" / "holdout_eval.py"
    assert holdout_file.exists()

    with open(holdout_file, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=str(holdout_file))

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute):
                assert node.func.attr not in ["fit", "fit_predict"], f"GATE G7 VIOLATION: holdout_eval calls .{node.func.attr}()!"


def test_calendar_successor_and_predecessor_rules():
    """Verify strict chronological adjacency rules for windows W01..W14."""
    assert calendar_successor("W01") == "W02"
    assert calendar_successor("W13") == "W14"
    assert calendar_successor("W14") is None

    assert calendar_predecessor("W14") == "W13"
    assert calendar_predecessor("W02") == "W01"
    assert calendar_predecessor("W01") is None

    with pytest.raises(ValueError):
        calendar_successor("INVALID")

    with pytest.raises(ValueError):
        calendar_predecessor("INVALID")


def test_error_standardization_and_labeling():
    """Verify error standardization math and threshold labeling."""
    median_ae = 0.20
    mad = 0.05
    threshold = 2.5804

    # AE = 0.20 -> StdError = 0.0 -> Not extreme
    std_err = standardize_error(0.20, median_ae, mad)
    assert std_err == pytest.approx(0.0)
    assert label_extreme_failures(std_err, threshold) == False

    # AE = 0.35 -> StdError = (0.35 - 0.20) / 0.05 = 3.0 > 2.5804 -> Extreme failure!
    std_err_high = standardize_error(0.35, median_ae, mad)
    assert std_err_high == pytest.approx(3.0)
    assert label_extreme_failures(std_err_high, threshold) == True

    # Zero variability meter: mad=0.0 -> mad_floor = 0.05 * 0.20 = 0.01
    std_err_floor = standardize_error(0.22, median_ae=0.20, mad=0.0)
    assert std_err_floor == pytest.approx((0.22 - 0.20) / 0.01)
