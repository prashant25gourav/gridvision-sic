"""Data quality checks module for GridVision (P1).

Enforces locked quality rules from Master Plan v4 §3:
1. No negative half-hourly readings.
2. 56-day common-calendar window completeness:
   - >= 95% slot fill (at least 2,554 of 2,688 half-hour slots).
   - Maximum consecutive gap <= 3 days (<= 144 half-hour slots).
3. Household qualification threshold: >= 6 usable windows.
"""

from typing import Tuple
import numpy as np
import pandas as pd


EXPECTED_SLOTS_PER_WINDOW = 2688  # 56 days * 48 half-hours
MIN_SLOT_FILL_PCT = 0.95
MAX_GAP_HALF_HOURS = 144  # 3 days * 48 half-hours
MAX_GAP_DAYS = 3.0
MIN_USABLE_WINDOWS = 6


def count_negative_readings(arr: np.ndarray) -> int:
    """Count number of negative readings in a numeric array, ignoring NaNs."""
    return int(np.sum((arr < 0) & ~np.isnan(arr)))


def compute_slot_metrics(readings_slot_series: np.ndarray) -> Tuple[float, float, bool]:
    """Calculate slot fill percentage, maximum consecutive gap in days, and usability.
    
    Args:
        readings_slot_series: 1D array of length 2,688 representing half-hourly readings
                              across the 56 days of a window. Missing slots are NaN.
                              
    Returns:
        Tuple of:
            - slot_fill_pct: float between 0.0 and 1.0 (rounded to 4 decimal places)
            - max_gap_days: float, longest consecutive missing streak converted to days
            - is_usable: bool, True if slot_fill_pct >= 0.95 and max_gap_days <= 3.0
    """
    total_slots = len(readings_slot_series)
    if total_slots == 0:
        return 0.0, 0.0, False

    valid_mask = ~np.isnan(readings_slot_series)
    n_valid = int(np.sum(valid_mask))
    slot_fill_pct = round(n_valid / float(total_slots), 4)

    # Fast path: all slots valid
    if n_valid == total_slots:
        return 1.0, 0.0, True

    # Fast path: all slots missing
    if n_valid == 0:
        max_gap_days = round(total_slots / 48.0, 2)
        return 0.0, max_gap_days, False

    # Check max consecutive gap
    max_gap_slots = 0
    curr_gap = 0
    for is_valid in valid_mask:
        if not is_valid:
            curr_gap += 1
            if curr_gap > max_gap_slots:
                max_gap_slots = curr_gap
        else:
            curr_gap = 0

    max_gap_days = round(max_gap_slots / 48.0, 2)
    is_usable = (slot_fill_pct >= MIN_SLOT_FILL_PCT) and (max_gap_slots <= MAX_GAP_HALF_HOURS)

    return slot_fill_pct, max_gap_days, is_usable
