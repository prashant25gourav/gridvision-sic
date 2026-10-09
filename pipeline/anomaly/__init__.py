"""GridVision Anomaly Detection Package (P3)."""

from pipeline.anomaly.explain import explain_anomaly_row, compute_feature_baselines
from pipeline.anomaly.isolation_forest import fit_anomaly_detector, detect_behavioral_anomalies
from pipeline.anomaly.synthetic_injection import inject_synthetic_anomalies, evaluate_synthetic_benchmark

__all__ = [
    "explain_anomaly_row",
    "compute_feature_baselines",
    "fit_anomaly_detector",
    "detect_behavioral_anomalies",
    "inject_synthetic_anomalies",
    "evaluate_synthetic_benchmark",
]
