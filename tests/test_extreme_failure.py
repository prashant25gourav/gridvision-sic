"""Tests for extreme-failure threshold derivation and acyclic dependency (P2)."""

import json
from pathlib import Path
import pytest
from pipeline.config import get_artifacts_dir
from pipeline.research.extreme_failure import derive_extreme_failure_threshold


def test_extreme_failure_threshold_artifact():
    """Verify extreme_failure_threshold.json matches Contract §3 schema."""
    latest = get_artifacts_dir("latest")
    json_path = latest / "extreme_failure_threshold.json"
    assert json_path.exists(), "extreme_failure_threshold.json does not exist!"

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    expected_keys = ["threshold_std_error_95th", "fallback_90th", "n_calibration_errors"]
    for k in expected_keys:
        assert k in data, f"Missing key {k} in extreme_failure_threshold.json"

    assert data["n_calibration_errors"] == 620
    assert data["threshold_std_error_95th"] > data["fallback_90th"]
    assert data["threshold_std_error_95th"] > 0
