"""Tests for 14 common-calendar windows (P1)."""

from datetime import date
import pytest
from pipeline.windows.calendar import (
    get_calendar_windows,
    get_window_map,
    get_window_for_date,
    calendar_successor,
    calendar_predecessor,
)


def test_14_windows_count_and_duration():
    """Verify exactly 14 windows, each 56 days (2,688 expected half-hour slots)."""
    windows = get_calendar_windows()
    assert len(windows) == 14
    for i, w in enumerate(windows, 1):
        assert w.id == f"W{i:02d}"
        assert w.days == 56
        assert w.expected_half_hours == 2688


def test_windows_are_contiguous_and_non_overlapping():
    """Verify windows are strictly contiguous without gaps or overlaps."""
    windows = get_calendar_windows()
    for i in range(len(windows) - 1):
        current_end = windows[i].end_date
        next_start = windows[i + 1].start_date
        diff = (next_start - current_end).days
        assert diff == 1, f"Gap or overlap between {windows[i].id} and {windows[i+1].id}: {diff} days"


def test_calendar_successor_and_predecessor():
    """Verify chronological successor and predecessor navigation."""
    assert calendar_successor("W01") == "W02"
    assert calendar_successor("W13") == "W14"
    assert calendar_successor("W14") is None

    assert calendar_predecessor("W01") is None
    assert calendar_predecessor("W02") == "W01"
    assert calendar_predecessor("W14") == "W13"


def test_date_lookup():
    """Verify date lookup inside and outside windows."""
    assert get_window_for_date("2011-11-24") == "W01"
    assert get_window_for_date("2012-01-18") == "W01"
    assert get_window_for_date("2012-01-19") == "W02"
    assert get_window_for_date("2014-01-15") == "W14"
    assert get_window_for_date("2010-01-01") is None
    assert get_window_for_date("2015-01-01") is None
