"""Forecast error standardization module for GridVision.

Standardizes raw absolute forecast errors against each household's own
calibration residual distribution.

Research Formulations:
- Formula:
    StdError(h, w) = (AE(h, w) - calibration_median_ae_h) / mad_effective_h
- MAD Effective Floor:
    mad_effective = max(calibration_mad, 0.05 * calibration_median_ae)
    Stops standardized score from exploding for near-zero variability meters.
- Extreme Failure Labeled:
    is_extreme_failure = (StdError > threshold_std_error_95th)
    Pre-fixed from extreme_failure_threshold.json, never tuned post-hoc.
"""

from typing import Dict, Union
import numpy as np
import pandas as pd


MAD_FLOOR_FACTOR = 0.05


def standardize_error(
    ae: Union[float, np.ndarray, pd.Series],
    median_ae: Union[float, np.ndarray, pd.Series],
    mad: Union[float, np.ndarray, pd.Series],
) -> Union[float, np.ndarray, pd.Series]:
    """Calculate standardized error with MAD effective floor.
    
    Args:
        ae: Raw Mean Absolute Error value(s).
        median_ae: Household's calibration median AE.
        mad: Household's calibration MAD.
        
    Returns:
        Standardized error value(s).
    """
    mad_floor = MAD_FLOOR_FACTOR * median_ae
    mad_effective = np.maximum(mad, np.maximum(mad_floor, 1e-4))
    return (ae - median_ae) / mad_effective


def label_extreme_failures(
    std_errors: Union[float, np.ndarray, pd.Series],
    threshold_95th: float,
) -> Union[bool, np.ndarray, pd.Series]:
    """Label extreme forecast failures using fixed 95th percentile threshold."""
    return std_errors > threshold_95th
