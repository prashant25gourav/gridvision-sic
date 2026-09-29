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

- [ ] Implement `pipeline/features/behavioral.py` — behavioral feature pipeline
  - Features: mean load, peak load, peak-to-average ratio, std dev, ramp-rate stats, day/night ratio, weekday/weekend contrast, peak timing
  - Scope: ALL usable windows including calibration pair
  - Produces: `behavioral_features.parquet`
  - Constraint: no NaNs; computed from that window's own readings only
  - Consumer: P1 (clustering), P2 (global/cluster forecasting), P3 (anomaly)

- [ ] Implement `pipeline/clustering/k_selection.py` — silhouette sweep (k=3..8) on pooled calibration-window features
  - Depends on: `behavioral_features.parquet`
  - Produces: fixed K in `config/pipeline.yaml`
  - Constraint: only calibration-window features used
  - Gate: G3 (partial)

### Day 7: First Clustering Pass

- [ ] Implement `pipeline/clustering/kmeans_fit.py` — K-Means on every usable window (including calibration pair)
  - Depends on: K selection, `behavioral_features.parquet`
  - Produces: `cluster_assignments.parquet` (raw)
  - Gate: G3

### Days 8–9: Alignment (CRITICAL PATH)

- [ ] Implement `pipeline/clustering/alignment.py` — Hungarian alignment across household's full usable-window sequence
  - Depends on: raw `cluster_assignments.parquet`
  - Produces: `cluster_assignments.parquet` (aligned)
  - Constraint: chain starts at calibration_1; P2 available to pair with P1 if this slips
  - Gate: G3

### Day 10: Instability & Volatility

- [ ] Implement `pipeline/instability/metrics.py` — persistence, instability, volatility (CV)
  - Depends on: aligned `cluster_assignments.parquet`
  - Produces: `instability_volatility.parquet` (Analysis windows only)
  - Constraint: first Analysis-window row has `n_transitions_observed == 2`; includes Cal-W1→Cal-W2 transition
  - Consumer: P2 (research table)
  - Gate: G3

---

## P2 — Forecasting / Statistics

### Days 5–6: Calibration Forecasting

- [ ] Implement `pipeline/forecasting/calibration_forecast.py` — per-household calibration forecaster
  - Depends on: P1's `calibration_assignment.parquet` ONLY (not clustering)
  - Produces: `calibration_residuals.parquet`, `calibration_summary.parquet`
  - Constraint: trains on exactly 1 HH's Cal-W1 only; no import of `global_forecaster.py`
  - Gate: G2

### Days 7–10: Extreme-Failure Threshold (Acyclic Order)

- [ ] Implement `pipeline/research/extreme_failure.py` — extreme-failure threshold computation
  - Depends on: pooled calibration StdError distribution (from `calibration_residuals.parquet` and `calibration_summary.parquet`)
  - Produces: `extreme_failure_threshold.json`
  - Constraint: fixed once from calibration data only; computed BEFORE research table labeling; check realized 95th-percentile rate, 90th fallback documented if needed
  - Gate: G6

### Days 11–12: Forecasting & Error Standardization

- [ ] Implement `pipeline/forecasting/global_forecaster.py` — pooled global forecaster
  - Depends on: `behavioral_features.parquet`
  - Produces: `forecast_global.parquet`
  - Constraint: `train_data.window <= w` assertion; retrained per calendar window
  - Gate: G4

- [ ] Implement `pipeline/forecasting/cluster_forecaster.py` — per-cluster forecaster (capstone-only)
  - Depends on: `behavioral_features.parquet`, `cluster_assignments.parquet`
  - Produces: `forecast_percluster.parquet`
  - Constraint: NEVER imported by `build_research_table.py` (static check); NEVER feeds research outcome

- [ ] Implement `pipeline/forecasting/error_standardization.py` — AE, StdError, MAD floor
  - Depends on: `forecast_global.parquet`, `calibration_summary.parquet`
  - Produces: standardized errors for every household/window-pair

### Days 13–14: Primary Experiment (CRITICAL PATH)

- [ ] Implement `pipeline/research/build_research_table.py` — research table construction & outcome labeling
  - Depends on: P1's `instability_volatility.parquet`, P2's `forecast_global.parquet`, `calibration_summary.parquet`, `extreme_failure_threshold.json`
  - Produces: `research_table.parquet`
  - Constraint: calendar-adjacent pairs only; both w and w+1 usable; outcome labeled using pre-fixed threshold; holdout row evaluated ONLY if immediate calendar predecessor is usable (never substitute non-adjacent window)
  - Gate: G5

- [ ] Implement `pipeline/research/statistical_model.py` — cluster-robust logistic regression
  - Depends on: `research_table.parquet` (Analysis rows only)
  - Produces: `statistical_results.json`
  - Gate: G6

### Day 15: Robustness

- [ ] Attempt ≥1 robustness check from v4 §8.8 priority list
- [ ] Begin drafting methods/early-results sections of write-up

### Day 19: Holdout

- [ ] Implement `pipeline/research/holdout_eval.py` — forward-only holdout evaluation
  - Depends on: fixed model & fixed threshold applied to eligible holdout rows
  - Produces: `holdout_results.json`
  - Constraint: no `.fit()` call; run exactly once; only evaluate households with usable immediate calendar predecessor
  - Gate: G7

---

## P3 — Anomaly / Explainability

### Day 16: Anomaly Detection

- [ ] Implement `pipeline/anomaly/isolation_forest.py` — Isolation Forest anomaly detector
  - Depends on: `behavioral_features.parquet`
  - Produces: `anomaly_flags.parquet`

- [ ] Implement `pipeline/anomaly/synthetic_injection.py` — synthetic injection evaluation
  - Produces: Precision/Recall/F1 on synthetic set

- [ ] Implement `pipeline/anomaly/explain.py` — feature-based anomaly explanation (NOT SHAP)

### Day 17: SHAP

- [ ] Implement `pipeline/explainability/shap_forecaster.py` — SHAP on global forecaster only
  - Depends on: P2's trained global forecaster
  - Produces: `shap_explanations.parquet`
  - Constraint: scoped to global forecaster only; anomaly explanation is separate

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

### Days 9–12: Wire Real Data

- [ ] Implement backend API endpoints matching Blueprint v2 §F:
  - [ ] `GET /overview`
  - [ ] `GET /household/{household_id}/forecast`
  - [ ] `GET /household/{household_id}/segment`
  - [ ] `GET /household/{household_id}/instability`
  - [ ] `GET /household/{household_id}/anomaly`
  - [ ] `POST /chat`
- [ ] Implement `backend/app/services/artifact_loader.py` — reads from `data/artifacts/latest`
- [ ] Replace frontend mock data with real API calls
- [ ] Implement proper error/loading/empty states

### Day 12: Deployment Skeleton

- [ ] Stand up Docker/HF Spaces skeleton
  - Fallback: local-only demo if not ready

### Day 18: RAG + Integration

- [ ] Create RAG knowledge base (5–10 markdown documents)
- [ ] Implement `backend/app/services/rag/index.py` — FAISS index
- [ ] Implement `backend/app/services/rag/retriever.py` — top-k cosine similarity retrieval
- [ ] Implement `backend/app/services/rag/tools.py` — tool-calling (get_forecast, get_segment, get_instability, get_anomaly)
- [ ] Implement grounding enforcement (numeric traceability check)
- [ ] Wire all screens to real pipeline outputs

---

## Shared Integration

- [ ] Create `pipeline/run_pipeline.py` — CLI entrypoint
- [ ] Create `Makefile` with targets: `setup`, `ingest`, `pipeline`, `backend`, `frontend`, `e2e-smoke`
- [ ] Create `config/pipeline.yaml` — pipeline configuration (seeds, K, thresholds)
- [ ] Run 50-HH integration gate (Team Execution Contract §5)
  - Depends on: all pipeline modules functional
  - Evidence: all 14 checks pass per §5 checklist
  - Gate: G8
- [ ] Run full 500–800 HH pipeline
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
