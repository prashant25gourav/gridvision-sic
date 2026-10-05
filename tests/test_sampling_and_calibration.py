"""Tests for stratified sampling and calibration selection (P1)."""

import pandas as pd
import pytest
from pipeline.sampling.stratified_sample import compute_strata_quotas
from pipeline.windows.calibration_select import assign_calibration_windows


def test_strata_quotas_calculation():
    """Verify proportional quota calculation and ACORN-U floor."""
    counts = pd.Series({
        "Affluent": 1623,
        "Adversity": 1445,
        "Comfortable": 1148,
        "ACORN-U": 36,
    })
    quotas = compute_strata_quotas(counts, target_sample_size=620, min_floor=5)

    assert sum(quotas.values()) == 620
    assert quotas["ACORN-U"] >= 5
    assert quotas["Affluent"] == 237
    assert quotas["Adversity"] == 211
    assert quotas["Comfortable"] == 167

    # Issue 4: Protected ACORN-U floor at 15
    quotas_15 = compute_strata_quotas(counts, target_sample_size=620, min_floor=15)
    assert sum(quotas_15.values()) == 620
    assert quotas_15["ACORN-U"] == 15
    assert quotas_15["Affluent"] == 233
    assert quotas_15["Adversity"] == 207
    assert quotas_15["Comfortable"] == 165


def test_calibration_assignment_logic():
    """Verify calibration pair, analysis windows, and holdout window assignment."""
    # Synthetic sampled households
    sampled_hh = pd.DataFrame({
        "household_id": ["HH_01", "HH_02"],
        "acorn_grouped": ["Affluent", "Adversity"],
        "n_usable_windows": [6, 8],
        "sample_seed": [42, 42],
    })

    # Synthetic eligibility
    elig_records = []
    # HH_01 has usable W01, W02, W03, W04, W05, W06 (6 usable)
    for i in range(1, 15):
        w_id = f"W{i:02d}"
        elig_records.append({
            "household_id": "HH_01",
            "window_id": w_id,
            "slot_fill_pct": 1.0 if i <= 6 else 0.0,
            "max_gap_days": 0.0,
            "is_usable": i <= 6,
        })
    # HH_02 has usable W03, W04, W06, W07, W08, W09, W10, W11 (8 usable)
    hh2_usable = {"W03", "W04", "W06", "W07", "W08", "W09", "W10", "W11"}
    for i in range(1, 15):
        w_id = f"W{i:02d}"
        is_u = w_id in hh2_usable
        elig_records.append({
            "household_id": "HH_02",
            "window_id": w_id,
            "slot_fill_pct": 1.0 if is_u else 0.0,
            "max_gap_days": 0.0,
            "is_usable": is_u,
        })

    elig_df = pd.DataFrame(elig_records)

    assignment = assign_calibration_windows(sampled_hh, elig_df)
    assert len(assignment) == 2

    # HH_01 checks
    row1 = assignment[assignment["household_id"] == "HH_01"].iloc[0]
    assert row1["calibration_window_1"] == "W01"
    assert row1["calibration_window_2"] == "W02"
    assert row1["first_analysis_window"] == "W03"
    assert row1["last_usable_window"] == "W06"
    assert row1["n_analysis_windows"] == 4

    # HH_02 checks (non-W01/W02 start)
    row2 = assignment[assignment["household_id"] == "HH_02"].iloc[0]
    assert row2["calibration_window_1"] == "W03"
    assert row2["calibration_window_2"] == "W04"
    assert row2["first_analysis_window"] == "W06"
    assert row2["last_usable_window"] == "W11"
    assert row2["n_analysis_windows"] == 6


def test_calibration_assignment_rejects_under_6_windows():
    """Verify that households with <6 usable windows raise an error."""
    sampled_hh = pd.DataFrame({
        "household_id": ["HH_FAIL"],
        "acorn_grouped": ["Comfortable"],
        "n_usable_windows": [5],
        "sample_seed": [42],
    })
    elig_df = pd.DataFrame([
        {"household_id": "HH_FAIL", "window_id": f"W{i:02d}", "is_usable": i <= 5}
        for i in range(1, 15)
    ])

    with pytest.raises(ValueError, match="minimum required for calibration assignment is 6"):
        assign_calibration_windows(sampled_hh, elig_df)
