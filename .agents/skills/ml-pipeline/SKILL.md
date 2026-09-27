---
name: ml-pipeline
description: >
  GridVision ML/data pipeline implementation guide. Enforces artifact contracts,
  schemas, deterministic behavior, and the correct pipeline sequence.
  Read this before implementing any pipeline module.
---

# GridVision — ML Pipeline Skill

## Purpose

Guides implementation of GridVision's offline ML/research pipeline modules.
Enforces artifact contracts, schemas, deterministic behavior, and the correct
processing sequence.

**Full specifications:** Implementation Blueprint v2 §C (schemas), §D (module contracts), §E (pipeline sequence).

## Pipeline Sequence

```
Raw LCL CSVs (hhblock_dataset/block_*.csv)
  → Ingestion: raw to Parquet (flat-rate only)                    [P1]
  → Data Quality Checks (0 negatives, window usability, ≥6 usable)[P1]
  → Window Construction (14 fixed common-calendar windows)        [P1]
  → Household Sampling (500–800, stratified by Acorn_grouped)     [P1]
  → Per-Household Calibration Assignment (own first 2 usable)     [P1]
  → Behavioral Features (ALL usable windows incl. calibration)    [P1]
  → K Selection (silhouette sweep on calibration features)        [P1]
  → K-Means Clustering (ALL usable windows incl. calibration)     [P1]
  → Hungarian Alignment (chained from Cal-W1 per household)       [P1]
  → Instability + Volatility (Analysis windows only; counts Cal)  [P1]
  → Calibration Forecasting (per-household, Cal-W1 → Cal-W2)      [P2]
  → Extreme-Failure Threshold (fixed from calibration only)       [P2]
  → Global Forecasting (pooled, per calendar window w → w+1)      [P2]
  → Per-Cluster Forecasting (capstone-only, NEVER research)       [P2]
  → Error Standardization (AE, StdError, MAD floor)               [P2]
  → Research Table (adjacent usable pairs, holdout predecessor)   [P2]
  → Statistical Analysis (cluster-robust logistic regression)     [P2]
  → Holdout Evaluation (once, forward-only, Day 19)               [P2]
  → Anomaly Detection (Isolation Forest)                          [P3]
  → SHAP (global forecaster only)                                 [P3]
```

**Do NOT add pipeline stages that are outside the master scope.**

## Artifact Contracts

Every artifact has a defined schema in Blueprint v2 §C. When implementing a module:

### Required for Every Artifact

1. **Grain:** Know the exact row granularity (per household? per household-window? per half-hour?).
2. **Key columns:** `household_id` (string), `window_id` (string — one of W01..W14).
3. **No orphaned IDs:** Every `household_id` must exist in `households_sampled.parquet`.
4. **No invented windows:** Every `window_id` must be one of the 14 LOCKED calendar windows.
5. **File format:** Parquet for data artifacts; JSON for summary/config artifacts.

### Validation Checks to Include

| Check | Where |
|---|---|
| Row count matches expected | Every module |
| No NaN in required fields | Every module |
| `household_id` consistency | Cross-check with `households_sampled.parquet` |
| `window_id` is valid (W01–W14) | Every module with window data |
| Chronological ordering | Every module with sequential windows |
| Calibration/analysis/holdout separation | Modules touching `window_role` |
| Fixed seed logged | Sampling, clustering, any stochastic process |

### Key Schema Summary

| Artifact | Grain | Key Fields | Producing Module |
|---|---|---|---|
| `households_sampled.parquet` | 1/household | household_id, acorn_grouped, n_usable_windows, sample_seed | `stratified_sample.py` |
| `window_eligibility.parquet` | 1/(HH, window) | household_id, window_id, is_usable | `eligibility.py` |
| `calibration_assignment.parquet` | 1/household | household_id, cal_w1, cal_w2, first_analysis, last_usable, n_analysis_windows | `calibration_select.py` |
| `behavioral_features.parquet` | 1/(HH, usable window incl. cal) | household_id, window_id, 8 features | `behavioral.py` |
| `cluster_assignments.parquet` | 1/(HH, usable window incl. cal) | household_id, window_id, window_role, raw/aligned labels | `kmeans_fit.py` → `alignment.py` |
| `instability_volatility.parquet` | 1/(HH, Analysis window) | household_id, window_id, instability, volatility_cv, n_transitions | `metrics.py` |
| `calibration_summary.parquet` | 1/household | household_id, median_ae, mad, mad_effective | `calibration_forecast.py` |
| `forecast_global.parquet` | 1/(HH, w+1, half-hour) | household_id, window_id, timestamp, predicted, actual | `global_forecaster.py` |
| `research_table.parquet` | 1/(HH, adjacent usable pair) | household_id, window_w, window_w_plus_1, instability, ae, std_error, is_extreme_failure, is_holdout | `build_research_table.py` |

## Implementation Rules

### Deterministic Behavior
- Use fixed random seeds for all stochastic operations (sampling, K-Means, train/test splits).
- Log seeds in `run_manifest.json`.
- Same inputs + same seed = same outputs.

### Run-Based Artifacts
- Each full pipeline run writes to `data/artifacts/run_<timestamp>/`.
- A `latest` symlink points to the most recent run.
- `run_manifest.json` records git commit hash, `config/pipeline.yaml` hash, and all seeds.
- **Never edit generated artifacts in place.** A bugfix = rerun into a new directory.

### Calibration/Analysis/Holdout Separation
- Every module must know which windows are calibration, analysis, or holdout for each household.
- `window_role` field in `cluster_assignments.parquet`: `"calibration_1"`, `"calibration_2"`, `"analysis"`, or `"holdout"`.
- Calibration windows get clustered but don't get instability score rows.
- Holdout window is processed last, once, forward-only.

### Testing on Pilot Before Scaling
- All modules must work on the 50-HH pilot before running on the full 500–800 sample.
- The 50-HH integration gate (Team Execution Contract §5) must pass before scaling.

## Common Implementation Mistakes

1. **Forgetting calibration windows in clustering.** Calibration windows MUST get K-Means labels — the first Analysis window needs a previous window to align against.
2. **Starting the alignment chain at the first Analysis window.** Chain starts at `calibration_1`.
3. **Counting only 1 transition for the first Analysis window.** It has 2: Cal-W1→Cal-W2 and Cal-W2→first-Analysis.
4. **Substituting non-adjacent windows.** If W06 is unusable, do NOT substitute W07 as "w+1" for W05.
5. **Training the calibration forecaster on pooled data.** It must train on exactly ONE household.
6. **Not applying the MAD floor.** `MAD_effective = max(MAD, 0.05 × calibration_median_ae)`.
7. **Recomputing the extreme-failure threshold from analysis data.** Threshold is fixed from calibration only.
8. **Substituting non-adjacent windows for holdout evaluation.** The final usable window is the holdout target and may only be evaluated if its immediate calendar predecessor is usable. Never substitute an earlier non-adjacent usable window; mark ineligible if predecessor is unavailable.
