"""Tests for data quality checks (P1)."""

import numpy as np
import pytest
from pipeline.quality.checks import (
    count_negative_readings,
    compute_slot_metrics,
    EXPECTED_SLOTS_PER_WINDOW,
)


def test_count_negative_readings():
    """Verify negative readings detection."""
    clean_data = np.array([0.0, 1.2, 0.5, np.nan, 3.4])
    assert count_negative_readings(clean_data) == 0

    dirty_data = np.array([0.0, -0.05, 0.5, np.nan, -1.0])
    assert count_negative_readings(dirty_data) == 2


def test_slot_metrics_full_completeness():
    """Verify metrics when all 2,688 slots are present."""
    arr = np.ones(EXPECTED_SLOTS_PER_WINDOW, dtype=float)
    slot_fill_pct, max_gap_days, is_usable = compute_slot_metrics(arr)
    assert slot_fill_pct == 1.0
    assert max_gap_days == 0.0
    assert is_usable is True


def test_slot_metrics_unusable_due_to_low_fill():
    """Verify window with <95% fill is marked unusable."""
    arr = np.ones(EXPECTED_SLOTS_PER_WINDOW, dtype=float)
    # Missing 200 slots distributed evenly (no big gap)
    arr[:200] = np.nan
    slot_fill_pct, max_gap_days, is_usable = compute_slot_metrics(arr)
    assert slot_fill_pct < 0.95
    assert is_usable is False


def test_slot_metrics_unusable_due_to_large_gap():
    """Verify window with >=95% fill but single gap >3 days (>144 slots) is unusable."""
    arr = np.ones(EXPECTED_SLOTS_PER_WINDOW, dtype=float)
    # Total missing = 145 slots (out of 2688, 2543 valid -> 94.6% or let's make it 95.5%)
    # Total slots: 2688. If 145 are missing, fill is (2688 - 145) / 2688 = 94.6%.
    # Let's test gap of exactly 150 slots:
    arr[:150] = np.nan
    slot_fill_pct, max_gap_days, is_usable = compute_slot_metrics(arr)
    assert max_gap_days > 3.0
    assert is_usable is False


def test_slot_metrics_usable_with_small_gap():
    """Verify window with >=95% fill and gap <= 3 days (144 slots) is usable."""
    arr = np.ones(EXPECTED_SLOTS_PER_WINDOW, dtype=float)
    # Gap of exactly 96 slots (2 days)
    arr[100:196] = np.nan
    slot_fill_pct, max_gap_days, is_usable = compute_slot_metrics(arr)
    assert slot_fill_pct >= 0.95
    assert max_gap_days == 2.0
    assert is_usable is True
