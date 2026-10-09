"""Unit tests for seasonal-naive baseline forecaster module (Issue 2)."""

import numpy as np
import pandas as pd
import pytest

from pipeline.forecasting.baseline_naive import compute_seasonal_naive_forecast
from pipeline.windows.calendar import get_window_map


def test_seasonal_naive_forecast_profile():
    """Verify seasonal-naive baseline produces matching profile by (day_of_week, half_hour)."""
    wmap = get_window_map()
    w1_dates = pd.date_range(wmap["W01"].start_date, wmap["W01"].end_date, freq="D").strftime("%Y-%m-%d").tolist()
    w2_dates = pd.date_range(wmap["W02"].start_date, wmap["W02"].end_date, freq="D").strftime("%Y-%m-%d").tolist()

    HH_COLS = [f"hh_{i}" for i in range(48)]

    # Deterministic pattern: Monday (dow=0) slot 10 = 2.5, Sunday (dow=6) slot 10 = 0.5
    mat_w1 = np.ones((len(w1_dates), 48)) * 1.0
    for d_idx, d in enumerate(w1_dates):
        dow = pd.to_datetime(d).dayofweek
        if dow == 0:
            mat_w1[d_idx, 10] = 2.5
        elif dow == 6:
            mat_w1[d_idx, 10] = 0.5

    df_readings = pd.DataFrame(mat_w1, columns=HH_COLS, index=w1_dates)

    preds_w2 = compute_seasonal_naive_forecast(
        household_readings_w=df_readings,
        w_train_dates=w1_dates,
        w_target_dates=w2_dates,
    )

    assert len(preds_w2) == 2688
    # For every Monday in W02 at slot 10, predicted value must be 2.5
    dows_w2 = [pd.to_datetime(d).dayofweek for d in w2_dates]
    idx = 0
    for d_idx, dow in enumerate(dows_w2):
        for hh in range(48):
            if dow == 0 and hh == 10:
                assert preds_w2[idx] == pytest.approx(2.5, abs=1e-4)
            elif dow == 6 and hh == 10:
                assert preds_w2[idx] == pytest.approx(0.5, abs=1e-4)
            idx += 1
