# GridVision — Task List (LIVE)

> **Purpose:** The team's live execution task list, organized by role.
> Updated after meaningful progress. Tasks come from the Team Execution Contract,
> Implementation Blueprint, and actual repository state.
>
> **Legend:**
> - [ ] Not started
> - [~] In progress
> - [x] Completed

**Last Updated:** 2026-09-27

---

## P1 — Data / Research Pipeline

### Days 1–2: Setup

- [x] Download raw LCL dataset and place in `data/raw/` (linked full 10.27 GB via junction)
- [x] Implement `pipeline/ingestion/to_parquet.py` — convert `hhblock_dataset/block_*.csv` to Parquet (flat-rate subsample only)
  - Produces: `data/interim/blocks/block_*.parquet` (112 blocks, 2.77M rows)
  - Consumer: QC
  - Gate: G1 — row/household counts match v4 §3 verified numbers (4,443 flat-rate metadata, 4,438 evaluated in blocks, 0 negatives)
- [x] Implement `pipeline/ingestion/metadata.py` — load and join `informations_households.csv`
  - Produces: household metadata with tariff/ACORN fields
- [x] Implement `pipeline/sampling/stratified_sample.py` — draw fixed 500–800 HH sample
  - Depends on: QC pass
  - Produces: `households_sampled.parquet` (620 HH, seed=42; 237 Affluent, 211 Adversity, 167 Comfortable, 5 ACORN-U)
  - Constraint: fixed random seed, stratified by `Acorn_grouped`, ACORN-U minimum floor
  - Consumer: everyone

### Days 3–4: Preprocessing

- [x] Implement `pipeline/quality/checks.py` — data quality validation
  - Checks: 0 negatives; window usability determined by locked ≥95% expected-slot and ≤3-consecutive-day gap criteria (qualifying pool requires ≥6 usable windows; a >7-day gap does not by itself imply whole-household exclusion)
  - Produces: `data_quality_report.json`, filtered household set
  - Gate: G1 (PASSED: 4,252 qualifying households, 2,974 with >=10 usable windows, median 10.0)
- [x] Implement `pipeline/quality/report.py` — quality report generation
- [x] Implement `pipeline/windows/calendar.py` — 14 fixed common-calendar windows
  - Produces: window date boundaries (W01 to W14, 56 days each)
- [x] Implement `pipeline/windows/eligibility.py` — per household-window usability
  - Rule: ≥95% half-hourly slots, no gap >3 consecutive days
  - Produces: `window_eligibility.parquet` (14 rows/HH)
- [x] Implement `pipeline/windows/calibration_select.py` — per-household calibration assignment
  - Produces: `calibration_assignment.parquet`
  - Constraint: each HH's own first 2 usable windows; `n_analysis_windows ≥ 4` (PASSED for all 620 sampled HHs)
  - Consumer: P2 (calibration forecast)

### Days 5–6: Feature Engineering & K Selection

- [x] Implement `pipeline/features/behavioral.py` — behavioral feature pipeline
  - Features: mean load, peak load, peak-to-average ratio, std dev, ramp-rate stats, day/night ratio, weekday/weekend contrast, peak timing
  - Scope: ALL usable windows including calibration pair
  - Produces: `behavioral_features.parquet` (6,198 rows, 0 NaNs)
  - Constraint: no NaNs; computed from that window's own readings only
  - Consumer: P1 (clustering), P2 (global/cluster forecasting), P3 (anomaly)

- [x] Implement `pipeline/clustering/k_selection.py` — silhouette sweep (k=3..8) on pooled calibration-window features
  - Depends on: `behavioral_features.parquet`
  - Produces: fixed K=4 in `config/pipeline.yaml` (silhouette=0.4021)
  - Constraint: only calibration-window features used (1,240 calibration observations)
  - Gate: G3 (partial)

### Day 7: First Clustering Pass

- [x] Implement `pipeline/clustering/kmeans_fit.py` — K-Means on every usable window (including calibration pair)
  - Depends on: K selection, `behavioral_features.parquet`
  - Produces: `cluster_assignments.parquet` (raw)
  - Gate: G3

### Days 8–9: Alignment (CRITICAL PATH)

- [x] Implement `pipeline/clustering/alignment.py` — Hungarian alignment across household's full usable-window sequence
  - Depends on: raw `cluster_assignments.parquet`
  - Produces: `cluster_assignments.parquet` (aligned; 6,198 rows across 620 HHs)
  - Constraint: chain starts at calibration_1; P2 available to pair with P1 if this slips
  - Gate: G3

### Day 10: Instability & Volatility

- [x] Implement `pipeline/instability/metrics.py` — persistence, instability, volatility (CV)
  - Depends on: aligned `cluster_assignments.parquet`
  - Produces: `instability_volatility.parquet` (Analysis windows only; 4,338 rows)
  - Constraint: first Analysis-window row has `n_transitions_observed == 2`; includes Cal-W1→Cal-W2 transition (PASSED)
  - Consumer: P2 (research table)
  - Gate: G3 (PASSED)

---

## P2 — Forecasting / Statistics

### Days 5–6: Calibration Forecasting

- [x] Implement `pipeline/forecasting/calibration_forecast.py` — per-household calibration forecaster
  - Depends on: P1's `calibration_assignment.parquet` ONLY (not clustering)
  - Produces: `calibration_residuals.parquet` (1,666,560 rows), `calibration_summary.parquet` (620 rows)
  - Constraint: trains on exactly 1 HH's Cal-W1 only; static check verifies no import of `global_forecaster.py`; runtime check verifies single household; MAD floor factor 0.05 applied
  - Gate: G2 (PASSED)

### Days 7–10: Extreme-Failure Threshold (Acyclic Order)

- [x] Implement `pipeline/research/extreme_failure.py` — extreme-failure threshold computation
  - Depends on: pooled calibration StdError distribution (from `calibration_residuals.parquet` and `calibration_summary.parquet`)
  - Produces: `extreme_failure_threshold.json` (95th pct = 2.5804, 90th fallback = 2.0605)
  - Constraint: fixed once from calibration data only; computed BEFORE research table labeling; acyclic pipeline dependency respected
  - Gate: G6 (threshold fixed once prospectively)

### Days 11–12: Forecasting & Error Standardization

- [x] Implement `pipeline/forecasting/global_forecaster.py` — pooled global forecaster
  - Depends on: `behavioral_features.parquet`
  - Produces: `forecast_global.parquet` (14,824,320 rows across all 13 transitions), `forecast_global_summary.parquet` (5,515 rows)
  - Constraint: `trained_up_to_window < window_id` runtime and unit-test verified; retrained per calendar window
  - Gate: G4 & G5 (PASSED)

- [x] Implement `pipeline/forecasting/cluster_forecaster.py` — per-cluster forecaster (capstone-only)
  - Depends on: `behavioral_features.parquet`, `cluster_assignments.parquet`
  - Produces: `forecast_percluster.parquet` (14,824,320 rows), `forecast_percluster_summary.parquet`
  - Constraint: NEVER imported by `build_research_table.py` (static AST check verified); NEVER feeds research outcome

- [x] Implement `pipeline/forecasting/error_standardization.py` — AE, StdError, MAD floor
  - Depends on: `forecast_global.parquet`, `calibration_summary.parquet`
  - Produces: standardized errors for every household/window-pair

### Days 13–14: Primary Experiment (CRITICAL PATH)

- [x] Implement `pipeline/research/build_research_table.py` — research table construction & outcome labeling
  - Depends on: P1's `instability_volatility.parquet`, P2's `forecast_global.parquet`, `calibration_summary.parquet`, `extreme_failure_threshold.json`
  - Produces: `research_table.parquet` (4,294 rows: 3,682 Analysis, 612 Holdout)
  - Constraint: calendar-adjacent pairs only (`calendar_successor(w) == w+1`); both w and w+1 usable; outcome labeled using pre-fixed threshold (2.5804); holdout row evaluated ONLY if immediate calendar predecessor is usable (612 eligible, 8 ineligible due to predecessor gap)
  - Gate: G5 (PASSED)

- [x] Implement `pipeline/research/statistical_model.py` — cluster-robust logistic regression
  - Depends on: `research_table.parquet` (Analysis rows only; 3,682 observations across 620 households)
  - Produces: `statistical_results.json`
  - Findings: Volatility OR = 7.3997 (p < 0.001); Instability OR = 1.1519 (95% CI [0.7357, 1.8035], p = 0.5364); LRT p = 0.2809. Null hypothesis H0 supported (instability adds no significant predictive power over volatility)
  - Gate: G6 (PASSED: cluster-robust SE confirmed, positive-event rate = 24.25% > 2.0%)

### Day 15: Robustness

- [ ] Attempt ≥1 robustness check from v4 §8.8 priority list
- [ ] Begin drafting methods/early-results sections of write-up

### Day 19: Holdout

- [x] Implement `pipeline/research/holdout_eval.py` — forward-only holdout evaluation
  - Depends on: fixed model & fixed threshold applied to eligible holdout rows (612 eligible households)
  - Produces: `holdout_results.json` (ROC-AUC = 0.7010, PR-AUC = 0.5375)
  - Constraint: no `.fit()` or `.fit_predict()` call (AST unit-test verified); run forward-only; only evaluates households with usable immediate calendar predecessor
  - Gate: G7 (PASSED)

---

## P3 — Anomaly / Explainability

### Day 16: Anomaly Detection

- [x] Implement `pipeline/anomaly/isolation_forest.py` — Isolation Forest anomaly detector
  - Depends on: `behavioral_features.parquet`
  - Produces: `anomaly_flags.parquet` (6,198 rows, 310 flagged anomalies at 5.00% contamination)
  - Features: 8 behavioral features, unsupervised Isolation Forest

- [x] Implement `pipeline/anomaly/synthetic_injection.py` — synthetic injection evaluation
  - Produces: `anomaly_benchmark.json`
  - Injects 4 synthetic patterns (extreme spike, prolonged drop, day/night inversion, erratic volatility)
  - Benchmark performance: Precision = 0.5383, Recall = 0.9850 (98.5%), F1 = 0.6961, ROC-AUC = 0.9330

- [x] Implement `pipeline/anomaly/explain.py` — feature-based anomaly explanation (NOT SHAP)
  - Evaluates household baseline mean & std across all 8 behavioral features
  - Assigns triggering statistic, z-score, severity level, and plain-language explanation

### Day 17: SHAP

- [x] Implement `pipeline/explainability/shap_forecaster.py` — SHAP on global forecaster only
  - Depends on: P2's trained global forecaster (`forecast_global.parquet`) and `behavioral_features.parquet`
  - Produces: `shap_explanations.parquet` (352,960 forecast point explanations across 620 households)
  - Constraint: scoped strictly to global forecaster only; anomaly explanation remains non-SHAP feature deviation


---

## P4 — Backend / Frontend / RAG

### Days 1–11: Scaffold & Mock Development

- [x] FastAPI skeleton with health check and system info endpoint
- [x] React + Vite + TypeScript project setup
- [x] UI shell with 4 views (Overview, Household Explorer, Behavioral Trajectory, Copilot)
- [x] Mock data for all views
- [x] Glassmorphic dark theme CSS design system
- [x] Reusable components (Card, Badge, MetricCard, TabNav)
- [x] Chart components (LoadChart, ClusterBarChart, TrajectoryFlow)
- [x] Dashboard Shell implementation (persistent minimizable sidebar, workspace switcher, Light/Dark theme consistency)

### Days 9–12: Wire Real Data

- [x] Implement backend API endpoints matching Blueprint v2 §F:
  - [x] `GET /overview`
  - [x] `GET /household/{household_id}/forecast`
  - [x] `GET /household/{household_id}/segment`
  - [x] `GET /household/{household_id}/instability`
  - [x] `GET /household/{household_id}/anomaly`
  - [x] `GET /households` (portfolio list for explorer)
  - [x] `POST /chat`
- [x] Implement `backend/app/services/artifact_loader.py` — cached in-memory and PyArrow filtered querying from `data/artifacts/latest`
- [x] Replace frontend mock data with real API calls (`frontend/src/services/api.ts`)
- [x] Implement proper error/loading/empty states across all 4 React views

### Day 12: Deployment Skeleton

- [ ] Stand up Docker/HF Spaces skeleton
  - Fallback: local-only demo if not ready

### Day 18: RAG + Integration

- [x] Create RAG knowledge base (5 domain markdown documents in `backend/app/services/rag/knowledge_base/`)
- [x] Implement `backend/app/services/rag/retriever.py` — top-k cosine similarity retrieval over passage chunks
- [x] Implement `backend/app/services/rag/tools.py` — tool-calling (`get_forecast`, `get_segment`, `get_instability`, `get_anomaly`)
- [x] Implement grounding enforcement (`backend/app/services/rag/grounding.py` — strict numeric traceability check)
- [x] Wire all screens to real pipeline outputs (Overview, Household Explorer, Trajectory, and Copilot)


---

## Shared Integration

- [x] Create `pipeline/run_pipeline.py` — CLI entrypoint (orchestrates P1, P2, P3 deterministic execution and writes run_manifest.json)
- [ ] Create `Makefile` with targets: `setup`, `ingest`, `pipeline`, `backend`, `frontend`, `e2e-smoke`
- [x] Create `config/pipeline.yaml` — pipeline configuration (seeds, K, thresholds)
- [x] Run 50-HH integration gate (Team Execution Contract §5) — verified via test suite and pilot artifacts
- [x] Run full 500–800 HH pipeline (completed for 620 households across all 14 windows, 23 artifacts generated)
- [ ] Final demo rehearsal (run twice, unassisted)


---

## Research / Documentation

- [ ] Literature novelty verification search (non-blocking for implementation, blocks novelty claims)
- [ ] Draft methods section (Day 15+)
- [ ] Draft results section (after H1/H0 result, Day 13–14)
- [ ] Document actual statistical results (from `statistical_results.json`, not invented)
- [ ] Document holdout results (from `holdout_results.json`)
- [ ] Document limitations (per v4 §21)
- [ ] Final write-up (Day 20)
- [ ] Demo rehearsal (Day 20)
