"""Tests for K selection and silhouette sweep (P1)."""

import json
import pytest
from pipeline.clustering.k_selection import run_k_selection_sweep
from pipeline.config import get_artifacts_dir


def test_k_selection_artifact_contract():
    """Verify k_selection_results.json exists and has valid optimal K."""
    latest = get_artifacts_dir("latest")
    json_path = latest / "k_selection_results.json"
    if not json_path.exists():
        pytest.skip("k_selection_results.json not yet generated")

    with open(json_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    assert "selected_k" in res
    assert res["selected_k"] in [3, 4, 5, 6, 7, 8]
    assert res["calibration_samples_count"] == 1240  # 620 HH * 2 calibration windows
    assert res["random_state"] == 42
    assert len(res["silhouette_sweep"]) == 6  # k=3..8


def test_k_selection_sweep_determinism():
    """Verify that running sweep with same seed yields identical results."""
    k1, res1 = run_k_selection_sweep(random_state=42)
    k2, res2 = run_k_selection_sweep(random_state=42)

    assert k1 == k2
    assert res1["best_silhouette_score"] == res2["best_silhouette_score"]
    assert res1["selected_k"] == 4
