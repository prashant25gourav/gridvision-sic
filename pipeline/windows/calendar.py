"""14 Fixed Common-Calendar Window Definitions (P1).

Authoritative source: GridVision Master Plan v4 §3.5, Blueprint v2 §C.2.
All 14 windows are 56 days (8 weeks), non-overlapping, common-calendar-aligned.
"""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Dict, List, Optional
import pandas as pd

from pipeline.config import load_config


@dataclass(frozen=True)
class CalendarWindow:
    """Represents one fixed 56-day common-calendar window."""
    id: str
    start_date: date
    end_date: date
    days: int = 56
    expected_half_hours: int = 2688  # 56 * 48


def get_calendar_windows(config_path: Optional[str] = None) -> List[CalendarWindow]:
    """Return all 14 fixed calendar windows in chronological order."""
    cfg = load_config(config_path)
    schedule = cfg["windows"]["schedule"]
    windows = []
    for item in schedule:
        start_d = datetime.strptime(item["start"], "%Y-%m-%d").date()
        end_d = datetime.strptime(item["end"], "%Y-%m-%d").date()
        windows.append(
            CalendarWindow(
                id=item["id"],
                start_date=start_d,
                end_date=end_d,
                days=(end_d - start_d).days + 1,
                expected_half_hours=((end_d - start_d).days + 1) * 48,
            )
        )
    return windows


def get_window_map(config_path: Optional[str] = None) -> Dict[str, CalendarWindow]:
    """Return a dictionary mapping window ID (e.g. 'W01') to CalendarWindow."""
    return {w.id: w for w in get_calendar_windows(config_path)}


def get_window_for_date(target_date: date | datetime | str, config_path: Optional[str] = None) -> Optional[str]:
    """Find which window ID a date belongs to, or None if outside all windows."""
    if isinstance(target_date, str):
        target_d = datetime.strptime(target_date[:10], "%Y-%m-%d").date()
    elif isinstance(target_date, datetime):
        target_d = target_date.date()
    else:
        target_d = target_date

    for w in get_calendar_windows(config_path):
        if w.start_date <= target_d <= w.end_date:
            return w.id
    return None


def calendar_successor(window_id: str) -> Optional[str]:
    """Return the literal calendar successor window (e.g. 'W01' -> 'W02', 'W14' -> None).
    
    Never returns 'next usable' — strictly chronological successor.
    """
    if not window_id.startswith("W") or not window_id[1:].isdigit():
        raise ValueError(f"Invalid window ID: {window_id}")
    num = int(window_id[1:])
    if num >= 14:
        return None
    return f"W{num + 1:02d}"


def calendar_predecessor(window_id: str) -> Optional[str]:
    """Return the literal calendar predecessor window (e.g. 'W02' -> 'W01', 'W01' -> None).
    
    Critical for holdout predecessor eligibility rule (Issue 4).
    """
    if not window_id.startswith("W") or not window_id[1:].isdigit():
        raise ValueError(f"Invalid window ID: {window_id}")
    num = int(window_id[1:])
    if num <= 1:
        return None
    return f"W{num - 1:02d}"
