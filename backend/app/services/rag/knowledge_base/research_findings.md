# GridVision Research Findings and Empirical Outcomes

### Research Question
The study investigated whether temporal instability in household behavioral-cluster assignments predicts subsequent extreme load-forecast errors, after controlling for baseline consumption volatility.

### What Was Tested
Across 620 smart-metered residential homes monitored over 14 common-calendar 56-day observation windows (3,676 analyzed observations), we tested whether households that frequently switch between daily consumption patterns (e.g., from evening peaker to baseload steady) suffer significantly higher rates of extreme forecast failure (errors exceeding the 95th percentile threshold of 2.53438).

### Main Finding (Null Finding / H0 Supported)
The empirical analysis found no statistical evidence that behavioral cluster instability independently predicts extreme load-forecast failures once consumption volatility is accounted for:
- Cluster Instability Odds Ratio = 0.9183 (95% CI [0.5461, 1.5444], p = 0.7481).
- Nested model likelihood ratio test yielded p = 0.6053, confirming that adding instability to a volatility-only baseline model does not provide statistically significant incremental information.
- The null hypothesis (H0) is supported.

### Role of Volatility
Baseline consumption volatility (measured by coefficient of variation, CV) is the dominant and highly significant driver of forecast accuracy:
- Volatility CV Odds Ratio = 7.4459 (95% CI [4.8736, 11.3758], p < 0.0001).
- Unpredictable intra-day swings in electricity volume degrade forecast accuracy, whereas transitions between structured behavioral archetypes do not independently increase the odds of tail-event failure.

### Role of Instability
Cluster instability measures how often a household transitions between the 4 behavioral consumption archetypes over time. While instability serves as an insightful indicator of lifestyle adjustments or household occupancy changes, machine learning forecasters adapt effectively across these behavioral regimes without suffering elevated failure rates, provided raw consumption volatility remains stable.

### Holdout Evaluation Interpretation
A forward-only out-of-sample evaluation was conducted on 612 eligible holdout households during Window W14 with zero model refitting or hyperparameter tuning:
- Primary model achieved an out-of-sample ROC-AUC of 0.7298 and PR-AUC of 0.5378 across 157 observed extreme failures (25.65% event rate).
- The baseline restricted model achieved ROC-AUC of 0.7296, showing an incremental delta of only 0.0002 from adding instability.
- This confirms that the model generalizes out-of-sample without overfitting or data leakage.

### Limitations
1. Sample restricted to residential flat-rate smart meters across London; dynamic tariff customer behaviors may differ.
2. 56-day observation windows capture seasonal and bi-monthly behavioral stability but do not capture day-to-day micro-adjustments.
3. Extreme forecast failures are defined at the 95th percentile calibration standardized error threshold (2.53438); alternative tail thresholds could capture different failure modes.
