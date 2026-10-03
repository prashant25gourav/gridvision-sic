# GridVision Research Methodology Summary

This document summarizes the core experimental design and research findings of the GridVision study.

### Research Question
Does longitudinal consumer segment instability predict tail-event forecast failure above and beyond consumption volatility?

### Key Methodology Elements
1. **Stratified Sampling:** 620 smart-metered London households sampled across ACORN socio-demographic groups (seed=42).
2. **Per-Household Calibration:** Each household's own first 2 usable 56-day windows serve as their baseline calibration period, avoiding enrollment-timing bias.
3. **Common-Calendar Windows:** 14 fixed 56-day windows (W01 to W14) spanning 2011 to 2014.
4. **Behavioral Features:** 8 standardized features per window (mean load, peak load, peak-to-average ratio, std load, ramp rate, day-night ratio, weekday-weekend contrast, peak timing).
5. **Clustering & Alignment:** K-Means with optimal K=4 (silhouette score 0.4021), tracked over time using chained Hungarian alignment.
6. **Global Demand Forecaster:** Pooled Gradient Boosted Decision Tree (HistGradientBoostingRegressor) retrained per calendar step predicting window w+1.
7. **TreeSHAP Explainability:** Local feature attributions calculated across all forecast predictions. Top drivers: mean_load (65.9%), half_hour (29.7%), std_load (3.3%).

### Primary Empirical Results (H1 vs H0)
- Logistic regression model: Failure ~ Volatility + Instability, with standard errors clustered at the household level.
- **Consumption Volatility:** Odds Ratio = 7.3997 (p < 0.001) — strong, highly significant predictor of extreme failure.
- **Cluster Instability:** Odds Ratio = 1.1519 (95% CI [0.7357, 1.8035], p = 0.5364).
- **Likelihood Ratio Test (LRT):** p = 0.2809.
- **Verdict:** The null hypothesis (H0) is supported. While behavioral instability indicates customer lifestyle changes, raw volatility remains the dominant driver of extreme forecast failure.
- **Forward-Only Holdout Evaluation:** Fixed model achieved ROC-AUC = 0.7010 and PR-AUC = 0.5375 on holdout households.
