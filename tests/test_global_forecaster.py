"""Unit tests for global forecaster lag features and leakage invariance (Issue 1)."""

import numpy as np
import pandas as pd
import pytest

from pipeline.forecasting.global_forecaster import (
    FEATURE_COLS,
    train_and_predict_window_transition,
)
from pipeline.windows.calendar import get_window_map


def test_feature_cols_contract():
    """Verify FEATURE_COLS includes required calendar, behavioral, and lag features."""
    required = [
        "half_hour",
        "day_of_week",
        "is_weekend",
        "mean_load",
        "peak_load",
        "std_load",
        "lag_halfhour_mean",
        "lag_dow_halfhour_mean",
        "lag_last_week",
        "lag_recent_7d_mean",
        "lag_recent_48h_mean",
    ]
    for feat in required:
        assert feat in FEATURE_COLS, f"Missing required feature: {feat}"


def test_lag_features_leakage_invariance():
    """Verify that lag features for window w+1 are derived strictly from window <= w.
    
    Mutating target window (w+1) readings must produce zero change in the
    input feature matrix and model predictions for w+1.
    """
    wmap = get_window_map()
    w1_dates = pd.date_range(wmap["W01"].start_date, wmap["W01"].end_date, freq="D").strftime("%Y-%m-%d").tolist()
    w2_dates = pd.date_range(wmap["W02"].start_date, wmap["W02"].end_date, freq="D").strftime("%Y-%m-%d").tolist()

    hh_id = "TEST_HH_001"
    HH_COLS = [f"hh_{i}" for i in range(48)]

    # Generate synthetic predictable readings for W01
    rng = np.random.default_rng(42)
    w1_vals = rng.uniform(0.1, 0.5, size=(len(w1_dates), 48))
    df_w1 = pd.DataFrame(w1_vals, columns=HH_COLS, index=w1_dates)

    # W02 readings: run 1 has baseline values
    w2_vals_1 = rng.uniform(0.2, 0.6, size=(len(w2_dates), 48))
    df_w2_run1 = pd.DataFrame(w2_vals_1, columns=HH_COLS, index=w2_dates)

    # Combined readings for Run 1
    combined_run1 = pd.concat([df_w1, df_w2_run1])

    # W02 readings: run 2 has wildly corrupted values in w+1 (e.g. 500.0)
    w2_vals_2 = np.full((len(w2_dates), 48), 500.0)
    df_w2_run2 = pd.DataFrame(w2_vals_2, columns=HH_COLS, index=w2_dates)

    combined_run2 = pd.concat([df_w1, df_w2_run2])

    # Synthetic eligibility and behavioral features
    elig_df = pd.DataFrame([
        {"household_id": hh_id, "window_id": "W01", "is_usable": True},
        {"household_id": hh_id, "window_id": "W02", "is_usable": True},
    ])
    bf_df = pd.DataFrame([
        {
            "household_id": hh_id,
            "window_id": "W01",
            "mean_load": float(np.mean(w1_vals)),
            "peak_load": float(np.max(w1_vals)),
            "std_load": float(np.std(w1_vals)),
        }
    ])

    # Run transition prediction for Run 1
    res1 = train_and_predict_window_transition(
        w_train="W01",
        w_target="W02",
        sampled_households={hh_id},
        eligibility_df=elig_df,
        behavioral_features_df=bf_df,
        interim_dir=None,
        hh_to_block={},
        windows_dict=wmap,
        random_state=42,
        readings_by_hh={hh_id: combined_run1},
    )

    # Run transition prediction for Run 2
    res2 = train_and_predict_window_transition(
        w_train="W01",
        w_target="W02",
        sampled_households={hh_id},
        eligibility_df=elig_df,
        behavioral_features_df=bf_df,
        interim_dir=None,
        hh_to_block={},
        windows_dict=wmap,
        random_state=42,
        readings_by_hh={hh_id: combined_run2},
    )

    # Predictions MUST BE 100% IDENTICAL because w+1 readings must never leak into features
    np.testing.assert_allclose(
        res1["predicted"].values,
        res2["predicted"].values,
        err_msg="LEAKAGE DETECTED: Global forecaster predictions changed when future window data was altered!",
    )
