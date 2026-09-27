---
name: research-integrity
description: >
  GridVision research integrity guard. Enforces the locked research methodology
  and prevents leakage, contamination, fabrication, and threshold manipulation.
  Read this before working on any pipeline, forecasting, or statistical component.
---

# GridVision — Research Integrity Skill

## Purpose

GridVision is both a capstone application AND an embedded research study. This skill
enforces the locked research methodology and guards against integrity violations.

**If an implementation appears to conflict with the locked methodology, STOP and flag
the issue rather than silently changing it.**

## The Research Design (reference only — full specification in v4)

- **Question:** Does temporal instability in household behavioral-cluster assignments predict subsequent extreme load-forecast errors, after controlling for intrinsic consumption volatility?
- **Design:** Prospective, associational, NOT causal.
- **Predictor:** Instability (at window w). **Outcome:** Extreme forecast failure (at window w+1). **Control:** Volatility (CV).
- **Population:** Flat-rate (Std) Low Carbon London households.
- **Statistical test:** Cluster-robust logistic regression, `Failure ~ Volatility + Instability`.

## Temporal Integrity Rules (LOCKED — v4 §4, Handoff §6)

### Calibration is Calibration

- Each household's calibration pair = its own first 2 usable windows.
- Calibration forecaster trains on ONE household's Cal-W1, predicts Cal-W2.
- Calibration residual distribution (median AE, MAD) comes ONLY from Cal-W2 errors.
- The extreme-failure threshold comes ONLY from the pooled calibration StdError distribution.
- **Calibration data NEVER gets re-derived or updated from analysis/holdout data.**

### Analysis is Prospective

- For each analysis window w:
  - Behavioral features use window w's own readings ONLY.
  - Cluster assignment uses window w's features + fixed K.
  - Instability/volatility at w uses ONLY data from windows 1..w (household's own sequence).
  - Forecast for w+1 uses a model trained on pooled data up to end of calendar window w.
  - Forecast error (AE) is computed from window w+1 actuals vs. predictions.
- **Nothing from w+1 or later is ever available when computing predictors at w.**

### Holdout is Touched Once

- Each household's holdout = its own LAST usable window.
- Used exactly ONCE, forward-only, at the very end (Day 19).
- Evaluated ONLY if its immediately preceding calendar window is usable and provides valid forecast context. Never substitute an earlier non-adjacent usable window. If the immediate predecessor is unavailable, mark the holdout evaluation as ineligible.
- NEVER used for tuning, threshold-setting, or model selection.
- No `.fit()` or `.fit_predict()` call anywhere in `holdout_eval.py`.
- If a bug is found in holdout, this is a BLOCKED incident — escalate, do not quietly rerun.

## Specific Leakage Threats to Guard Against

### Future Leakage
- **Threat:** Using window w+1 data when computing features/scores for window w.
- **Guard:** Every module must assert `max(window_id_used) <= w` when computing at time w.

### Calibration Contamination
- **Threat:** Using analysis or holdout residuals to compute the extreme-failure threshold.
- **Guard:** `extreme_failure_threshold.json` is computed BEFORE any analysis-window label is assigned. It is NEVER recomputed.

### Future Behavioral Features
- **Threat:** Computing behavioral features using readings from outside the current window.
- **Guard:** Each window's features use only that window's own half-hourly readings.

### Incorrect Forecast Training Windows
- **Threat:** Training the global forecaster using data from beyond calendar window w when predicting w+1.
- **Guard:** `train_data.window <= w` assertion in `global_forecaster.py`.

### Incorrect Target Alignment
- **Threat:** Substituting a household's "next usable window" when the calendar successor w+1 is unusable.
- **Guard:** `window_w_plus_1 == calendar_successor(window_w)` strictly enforced. Non-adjacent pairs are DROPPED, not substituted. (DERIVED rule — Blueprint v2 §C.9)

### Non-Adjacent Window Substitution
- **Threat:** Using W07 as "w+1" when a household has usable W05 and W07 but unusable W06.
- **Guard:** No research-table row is produced for that pair. The household simply has fewer observations.

### Incorrect Cluster Alignment
- **Threat:** Aligning clusters against a different household's labels, or skipping the calibration pair in the alignment chain.
- **Guard:** Alignment chain starts at calibration_1 for each household. Cost matrix uses same household, consecutive usable windows only.

### Threshold Leakage
- **Threat:** Setting the 95th-percentile threshold using analysis/holdout StdError values instead of calibration-only, or circular dependency on the research table.
- **Guard:** Threshold computed from calibration StdError pool exclusively, fixed before labeling research table outcomes. Correct acyclic dependency: calibration forecasts → calibration residuals → calibration standardized errors → fixed threshold → analysis forecast errors → standardized errors → extreme-failure labels → research table → statistics.

### Holdout Contamination
- **Threat:** Using holdout data for tuning or re-fitting any model.
- **Guard:** No fitting operations in `holdout_eval.py`. Code review required (Gate G7).

### Non-Adjacent Holdout Evaluation
- **Threat:** Using an earlier non-adjacent usable window (e.g., W12 -> W14 when W13 is unusable) to forecast the holdout window.
- **Guard:** Predecessor check: `calendar_predecessor(last_usable_window)` must be usable; otherwise marked ineligible. Never substitute an earlier non-adjacent window.

### Post-Hoc Threshold Tuning
- **Threat:** Adjusting the 95th percentile threshold after seeing results to chase significance.
- **Guard:** The ONLY sanctioned fallback is to the pre-specified 90th percentile, and only if the realized positive-event rate is genuinely too low for stable estimation.

## Fabrication Guards

- **Do NOT invent statistical results.** Numbers come from executed `statistical_results.json`.
- **Do NOT cherry-pick households or windows** to improve results.
- **Do NOT claim statistical significance** that the actual analysis didn't produce.
- **Results must be reproducible** — every pipeline run logs git commit, config hash, and seeds in `run_manifest.json`.
- **A null or weak result is a valid finding**, not a failure. Report it honestly.

## Global vs. Per-Cluster Forecaster Boundary (LOCKED)

- **Global forecaster** (`global_forecaster.py`) = the SOLE source of the research outcome (H1/H0).
- **Per-cluster forecaster** (`cluster_forecaster.py`) = capstone-only, NEVER feeds the research outcome.
- These two must NEVER be merged or have their outputs cross-contaminated.
- `build_research_table.py` must NEVER import from `cluster_forecaster.py` (enforced by static import check).

## Key Formulas (reference — full specification in v4 §8)

- **Persistence(h, w)** = 1 − (cluster changes across h's usable windows 1..w) / (transitions observed for h through w)
- **Instability(h, w)** = 1 − Persistence(h, w)
- **AE(h, w+1)** = mean absolute error across all half-hourly predictions in w+1, GLOBAL forecaster only
- **StdError** = (AE − calibration median AE) / MAD_effective
- **MAD_effective** = max(MAD, 0.05 × calibration median AE)
- **Extreme failure** = StdError > 95th percentile of pooled calibration StdError distribution

## When to STOP

If you discover any of the following, **STOP immediately and report**:

1. A module is using future data it shouldn't have access to.
2. The extreme-failure threshold is being recomputed from non-calibration data.
3. The holdout is being used for anything other than the single final forward pass.
4. Per-cluster forecaster output is feeding the research table.
5. Statistical results look implausible or appear to have been manually adjusted.
6. The methodology is being changed to "make results work."
