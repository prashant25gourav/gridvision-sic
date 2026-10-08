# GridVision — Project State (LIVE)

> **Purpose:** This is the single source of truth for what GridVision is ACTUALLY DOING right now.
> It is updated after every meaningful change to the repository.
>
> **Do not confuse this with the master files.** The master files define what GridVision IS.
**Last Updated:** 2026-10-08 (Final Release Audit & Main-Readiness Verification Completed)

---

## A. PROJECT BASELINE (established by master files)

| Item | Status | Source |
|---|---|---|
| Research question | LOCKED | Master Plan v4 §1.2 |
| Dataset (LCL, Kaggle) | VERIFIED | Master Plan v4 §3 (two verification rounds) |
| Per-household calibration design | LOCKED | Master Plan v4 §4 |
| 14 fixed common-calendar windows | LOCKED | Master Plan v4 §3.5 |
| Behavioral features (8 features) | LOCKED | Master Plan v4 §8.2 |
| K-Means + Hungarian alignment | LOCKED | Master Plan v4 §8.3–8.4 |
| Global forecaster (research) + per-cluster (capstone) | LOCKED | Master Plan v4 §5 |
| Extreme-failure threshold (95th pct, 90th fallback) | LOCKED | Master Plan v4 §8.5 |
| Cluster-robust logistic regression (H1/H0) | LOCKED | Master Plan v4 §8.6 |
| 20-day execution schedule | LOCKED | Master Plan v4 §15 |
| 4-person team roles (P1–P4) | LOCKED | Team Execution Contract §1 |
| System architecture (FastAPI + React + Vite) | LOCKED | Master Plan v4 §6 |
| Repository/module structure | LOCKED | Implementation Blueprint v2 §B |
| Artifact contracts and schemas | LOCKED | Implementation Blueprint v2 §C |
| 50-HH integration gate | LOCKED | Team Execution Contract §5 |
| Out-of-scope items | LOCKED | Master Plan v4 §16 / Handoff §16 |

---

## B. REPOSITORY IMPLEMENTATION STATUS

### What actually exists in the repository RIGHT NOW

**Overall state: FULLY IMPLEMENTED & INTEGRATED.**

The repository contains the complete offline ML & research pipeline (P1, P2, P3), the FastAPI backend with cached artifact loader and RAG Copilot (P4), and the React + Vite frontend connected to live pipeline endpoints across all 4 operational views.

#### Backend (`backend/`)

| Component | Status | Notes |
|---|---|---|
| FastAPI entrypoint (`app/main.py`) | IMPLEMENTED | Health check (`/health`), root (`/`), CORS middleware, mounted at `/` and `/api/v1` |
| Config (`app/core/config.py`) | IMPLEMENTED | Basic settings class (project name, version, CORS origins) |
| API router (`app/api/v1/api.py`) | IMPLEMENTED | Routes system, overview, household, and chat endpoints |
| System endpoint (`app/api/v1/endpoints/system.py`) | IMPLEMENTED | `GET /system/info` returns app metadata |
| `/overview/grid` endpoint | IMPLEMENTED | Returns utility KPIs: total consumption (200.3 MWh), peak load (0.229 MW at 19:00), average demand (0.149 MW), attention count (44), diurnal series, and operational alerts |
| `/demand/analysis` endpoint | IMPLEMENTED | Returns 48-slot diurnal load curve, weekday vs weekend comparison (-3.1%), 14-window trend (W01–W14), seasonal summaries, and peak/baseload characteristics |
| `/consumers/rankings` endpoint | IMPLEMENTED | Returns cohort rankings by load, peak demand, forecast MAE, anomaly flags, instability, and load factor with attention classification |
| `/consumers/{id}/profile` endpoint | IMPLEMENTED | Returns complete household profile: load factor, peak-to-average, 24h curve, 14-window trajectory, and grounded "why flagged" explanation |
| `/anomalies/analysis` endpoint | IMPLEMENTED | Returns operational anomaly metrics, window timeline, severity distribution, and affected consumers table with action guidelines |
| `/forecast/portal` endpoint | IMPLEMENTED | Returns 24h horizon expected demand, peak forecast, accuracy benchmarks (MAE 0.081 kW), and confidence distribution (High/Medium/Needs Attention) |
| `/chat` endpoint (`app/api/v1/endpoints/chat.py`) | VERIFIED & AUDITED | Deterministic tool execution (`get_forecast`, `get_segment`, `get_instability`, `get_anomaly`, `get_grid_demand`), RAG retrieval over TF-IDF knowledge base, strict numeric grounding verification, and developer trace |
| Artifact loader service (`app/services/artifact_loader.py`) | IMPLEMENTED | Precomputed demand cache and PyArrow queries from `data/artifacts/latest/` |
| `requirements.txt` | IMPLEMENTED | Contains fastapi, uvicorn, pydantic, pandas, pyarrow, scikit-learn |

#### Frontend (`frontend/`)

| Component | Status | Notes |
|---|---|---|
| Vite + React 19 + TypeScript setup | IMPLEMENTED | `package.json`, `vite.config.ts`, `tsconfig` files; builds in <950ms |
| Product Navigation Shell | IMPLEMENTED | 4 logical tiers: OVERVIEW (Grid Overview), ANALYTICS (Demand Analysis, Consumer Intelligence, Anomaly Analysis, Forecasting), INTELLIGENCE (AI Copilot), RESEARCH (Research Findings, Methodology) |
| Overview Gateway Page | REFINED & PRESENTATION-READY | Single-page editorial & technical architecture overview: 13 structured sections, 3-level information hierarchy (Plain Language -> Method -> Technical Deep-Dive), clean Capstone vs Research separation, precise LightGBM/K-Means/Isolation Forest/Copilot descriptions, zero raw metric dumping, smooth-scrolling cross-dashboard anchor links |
| Grid Overview Workspace | IMPLEMENTED | 6 utility KPIs, period-over-period trend, weekday/weekend contrast, diurnal load curve, 3 operational alerts with 1-click navigation |
| Demand Analysis Workspace | IMPLEMENTED | Dedicated analytical workspace: 24h diurnal curve, weekday vs weekend comparison, multi-window trend (W01–W14), seasonal comparison, and peak dynamics |
| Consumer Intelligence Workspace | IMPLEMENTED | Consumer rankings table (6 sort modes) + Household explorer directory + full meter deep-dive with load factor, 24h curve, trajectory, and grounded explanation |
| Anomaly Analysis Workspace | IMPLEMENTED | Operational anomaly detection: timeline, severity breakdown, and affected consumers table with Date / Severity / Observed Pattern / Action |
| Day-Ahead Forecasting Workspace | IMPLEMENTED | Expected demand (0.240 kW/home), peak forecast (0.229 MW at 19:00), MAE 0.081 kW (+31.4% gain), and confidence tiers |
| AI Copilot Workspace | VERIFIED & REFINED | Refined dashboard presentation matching style: "Learn about AI Copilot" link, "Consumer" context, no fake telemetry, structured answers (`DIRECT ANSWER` + `WHAT THIS MEANS` + `OPERATIONAL GUIDANCE`), categorized working questions, trace inspector, 100% grounded in GridVision artifacts |
| Research Findings & Methodology | IMPLEMENTED | Clean, professional secondary workspaces communicating empirical regression results and rigorous experimental controls |
| Dashboard Workspaces (8 modules) | INTEGRATED | Fully wired to real artifacts/endpoints: Overview, Forecasting, Households, Segmentation, Anomalies, Copilot, Research Findings, Research Methodology |
| API client (`src/services/api.ts`) | IMPLEMENTED | Full TypeScript client talking to FastAPI backend with verified artifact fallbacks |
| CSS design system (`index.css`, `tokens.css`, `Workspaces.css`) | IMPLEMENTED | Restrained semantic dark/light design system without AI-slop |
| Connection to real backend data | INTEGRATED | All 8 dashboard workspaces wired to real pipeline artifacts and endpoints |


#### ML / Pipeline (`pipeline/`)

| Component | Status | Notes |
|---|---|---|
| `inspect_dataset.py` | IMPLEMENTED | Read-only diagnostic utility for inspecting raw CSV/Parquet files |
| `pipeline/` directory | IMPLEMENTED | Core pipeline structure created per Blueprint v2 §B |
| Config loader (`pipeline/config.py`) | IMPLEMENTED | Loads YAML config, resolves project root and artifact directories |
| Ingestion (`to_parquet.py`) | IMPLEMENTED | Converted all 112 raw blocks (2.77M rows) to flat-rate Parquet (`data/interim/blocks/`) |
| Metadata (`metadata.py`) | IMPLEMENTED | Loads `informations_households.csv`, verified 4,443 flat-rate households, 0 negatives |
| Data quality checks (`checks.py`, `report.py`) | IMPLEMENTED | Validated 95% slot completeness, <=3-day gaps, 0 negatives. Gate G1 PASSED. |
| Calendar windows (`calendar.py`) | IMPLEMENTED | 14 contiguous 56-day common-calendar windows (W01–W14) |
| Window eligibility (`eligibility.py`) | IMPLEMENTED | Evaluated 4,438 flat-rate households; 4,252 qualifying (>=6 usable), 2,974 with >=10 |
| Sampling (`stratified_sample.py`) | IMPLEMENTED | Stratified sample of 620 HHs drawn (seed=42; 233 Affluent, 207 Adversity, 165 Comfortable, 15 ACORN-U per DEC-013) |
| Calibration assignment (`calibration_select.py`) | IMPLEMENTED | Per-household own first-2-usable calibration pair; all 620 HHs have n_analysis_windows >= 4 |
| Behavioral features (`behavioral.py`) | IMPLEMENTED | 8 features on ALL 6,191 usable windows across 620 HHs, 0 NaNs |
| K selection (`k_selection.py`) | IMPLEMENTED | Silhouette sweep on 1,240 calibration samples; optimal K=4 (silhouette=0.4021) |
| Clustering (K-Means, `kmeans_fit.py`) | IMPLEMENTED | K-Means (K=4, seed=42) per window; assigned roles: 4,331 analysis, 1,240 cal, 620 holdout |
| Alignment (Hungarian, `alignment.py`) | IMPLEMENTED | Chained Hungarian alignment per household starting from cal_w1; output 6,191 rows |
| Instability / volatility metrics (`metrics.py`) | IMPLEMENTED | Persistence, instability, volatility CV; 4,331 Analysis rows; first row trans=2 (Gate G3 PASSED) |
| Calibration forecasting (`calibration_forecast.py`) | IMPLEMENTED | Per-household GBDT forecaster on Cal-W1 predicting Cal-W2; 1,666,560 residuals, 620 summary rows (Gate G2 PASSED) |
| Extreme-failure threshold (`extreme_failure.py`) | IMPLEMENTED | 95th pct threshold = 2.53438 (fallback 90th = 2.03492) pre-fixed strictly from calibration StdErrors (Gate G6) |
| Global forecasting (`global_forecaster.py`) | IMPLEMENTED | Pooled GBDT retrained per calendar window with locked lag features; 14,805,504 half-hourly predictions, 5,508 summary rows (Gates G4 & G5 PASSED, beats seasonal-naive baseline) |
| Per-cluster forecasting (`cluster_forecaster.py`) | IMPLEMENTED | Separate GBDT trained per behavioral cluster for UI comparison; 14,805,504 rows (capstone only, isolated from research table) |
| Error standardization (`error_standardization.py`) | IMPLEMENTED | Standardized error with MAD effective floor (factor 0.05) and threshold labeling |
| Research table construction (`build_research_table.py`) | IMPLEMENTED | Joined instability at w, global forecast AE at w+1, calibration summary, and fixed threshold; 4,288 rows (3,676 Analysis, 612 Holdout) |
| Statistical model (`statistical_model.py`) | IMPLEMENTED | Cluster-robust logistic regression on 3,676 Analysis rows; Volatility OR=7.4459 (p<0.0001), Instability OR=0.9183 (p=0.7481), Event Rate=18.96%; H0 supported (Gate G6 PASSED) |
| Holdout evaluation (`holdout_eval.py`) | IMPLEMENTED | Forward-only scoring of fixed post-lag-fix model on 612 eligible holdouts (0 fit calls); ROC-AUC=0.7298, PR-AUC=0.5378, Event Rate=25.65% (157 / 612), Brier=0.16813, Log Loss=0.51322 (Gate G7 PASSED, DEC-015) |
| Anomaly detection (`isolation_forest.py`, `explain.py`) | IMPLEMENTED | Unsupervised Isolation Forest (contamination=0.05, seed=42) on 8 behavioral features with plain-language z-score feature-based explanations (NOT SHAP); produces `anomaly_flags.parquet` (6,191 rows, 310 anomalies) |
| Synthetic anomaly benchmark (`synthetic_injection.py`) | IMPLEMENTED | Injects 4 realistic perturbation patterns; produces `anomaly_benchmark.json` (Precision=0.5383, Recall=0.9850, F1=0.6961, ROC-AUC=0.9330) |
| TreeSHAP explainability (`shap_forecaster.py`) | IMPLEMENTED | TreeSHAP feature attributions strictly scoped to global forecaster; produces `shap_explanations.parquet` (352,512 explained forecast points across 620 households) | points across 620 households) |

#### Data (`data/`)

| Component | Status | Notes |
|---|---|---|
| `data/raw/` | LINKED | Windows junction to 10.27 GB raw dataset (`hhblock_dataset/block_*.csv`) |
| `data/interim/` | IMPLEMENTED | 112 converted flat-rate Parquet blocks in `data/interim/blocks/` |
| `data/artifacts/` | IMPLEMENTED | `run_initial` contains all 23 artifacts + `run_manifest.json`; `latest` junction active |
| `data/processed/` | EMPTY | Reserved for final unified tables |

#### Tests (`tests/`)

| Component | Status | Notes |
|---|---|---|
| `tests/` directory | IMPLEMENTED | 58/58 passing tests covering all P1, P2, P3, and P4 modules, Gates G1-G7 checks, isolation, TreeSHAP, API contracts, and numeric grounding |

#### Configuration

| Component | Status | Notes |
|---|---|---|
| `.env.example` (root) | IMPLEMENTED | Basic env template (project name, API prefix, CORS, host/port) |
| `frontend/.env.example` | IMPLEMENTED | Contains `VITE_API_URL` |
| `.gitignore` | IMPLEMENTED | Updated to ignore raw, interim, caches, and `data/artifacts/latest` junction |
| `config/pipeline.yaml` | IMPLEMENTED | Locked parameter configuration per Master Plan v4 |
| `Makefile` | NOT STARTED | Does not exist (specified in Blueprint v2 §K) |

#### Documentation

| Component | Status | Notes |
|---|---|---|
| `README.md` | IMPLEMENTED | Documents the current scaffold; references "masterplan" but does not point to `docs/gridvision_master_files/` or `docs/current_status/` |
| `docs/gridvision_master_files/` | LOCKED | All 4 master files present |
| `docs/current_status/` | LIVE | Updated reflecting P1, P2, P3, and P4 complete status |

---

## C. TEAM STATUS

| Role | Scope | Current State |
|---|---|---|
| **P1** — Data / Research Pipeline Lead | Ingestion, QC, sampling, common-calendar windows, per-household calibration assignment, behavioral features, K selection / K-Means, cluster alignment / Hungarian matching, instability, volatility | COMPLETE — Milestones M0, M1, M2 & Gates G1, G3 PASSED (Days 1–10 deliverables implemented & verified) |
| **P2** — Forecasting / Statistics | Calibration forecaster, global forecaster, per-cluster forecaster (capstone-only), forecast-error standardization, extreme-failure threshold, research table construction, statistical analysis, holdout evaluation | COMPLETE — Milestones M3, M4, M5, M6, M7 & Gates G2, G4, G5, G6, G7 PASSED (Days 5–14, 19 deliverables implemented & verified) |
| **P4** — Backend / Frontend / RAG | FastAPI backend, React frontend, RAG / Copilot (retriever + tools + grounding check), integrating all 23 artifacts into app | COMPLETE — Milestones M8, M10 (Days 1–12, 18 deliverables implemented & verified: 7 API endpoints, artifact loader, RAG Copilot, 4 React views connected to live data) |

---

## D. CURRENT PHASE

**Phase: Days 1–19 Complete (Full System Integration & Step 1 Holdout Resolution Complete)**

All data, research, forecasting, statistical, anomaly detection, SHAP explainability, backend API, RAG Copilot, and frontend views are fully built, tested, and validated:
- Raw dataset ingested to Parquet (112 blocks, 2.77M rows, 0 negatives).
- Window eligibility evaluated (4,252 qualifying households, exact match with v4 §3).
- Stratified sample drawn (620 households, seed=42; 233 Affluent, 207 Adversity, 165 Comfortable, 15 ACORN-U per DEC-013).
- Per-household calibration assigned (own first-2 usable windows; all 620 have n_analysis >= 4).
- Behavioral features computed across all 6,191 usable windows (0 NaNs).
- Silhouette sweep completed on calibration features fixing optimal K=4 (silhouette=0.4021).
- K-Means clustered per window and Hungarian aligned per household sequence.
- Instability and volatility metrics computed for all 4,331 Analysis windows (transition 1->2 recorded).
- Calibration forecaster, extreme-failure threshold (2.53438), global & cluster forecasters trained.
- Primary research experiment completed: cluster-robust logistic regression on 3,676 Analysis rows supports H0 (instability OR=0.9183, p=0.7481; volatility OR=7.4459, p<0.0001; event rate 18.96%).
- Forward-only holdout evaluation completed on corrected model: ROC-AUC = 0.7298, PR-AUC = 0.5378, Event Rate = 25.65% (157 / 612 eligible holdouts; refit_performed: False, DEC-015).
- Isolation Forest anomaly detection (5.00% contamination, 310 anomalies flagged) with feature-based z-score explanations.
- Synthetic anomaly injection benchmark: 98.50% recall, 0.9330 ROC-AUC.
- TreeSHAP feature attributions on global forecaster across 352,512 forecast instances.
- FastAPI backend serving all Blueprint v2 §F endpoints (`/overview`, `/household/...`, `/households`, `/chat`) from `data/artifacts/latest`.
- RAG Copilot with domain knowledge base, tools, and strict numeric grounding enforcement.
- React 19 + TypeScript + Vite frontend built and wired across all 4 operational views.
- Full test suite passes: 58/58 tests.

---

## E. COMPLETED

### Master Plan & Foundation
- [x] Master Plan finalized and locked (v4)
- [x] Dataset verification (two rounds against real Kaggle files, 10.27 GB raw dataset linked)
- [x] Per-household calibration design decided and verified
- [x] AI Handoff Context written and locked
- [x] Implementation Blueprint written and self-audited (v2)
- [x] Team Execution Contract written
- [x] Targeted master-document reconciliation pass completed (Issues 1–4 resolved)
- [x] Living project status documents maintained (`docs/current_status/`)
- [x] Agent skills created and aligned (`.agents/skills/`)

### P1 — Data & Research Pipeline (Days 1–10)
- [x] Raw CSV ingestion to Parquet (`pipeline/ingestion/to_parquet.py`): 112 blocks converted to `data/interim/blocks/`
- [x] Data quality checks & report (`pipeline/quality/checks.py`, `report.py`): Gate G1 PASSED
- [x] 14 common-calendar 56-day windows (`pipeline/windows/calendar.py`): W01–W14
- [x] Window usability evaluation (`pipeline/windows/eligibility.py`): 4,252 qualifying households (>=6 usable)
- [x] Stratified household sampling (`pipeline/sampling/stratified_sample.py`): 620 HHs drawn (seed=42; 233 Affluent, 207 Adversity, 165 Comfortable, 15 ACORN-U)
- [x] Per-household calibration assignment (`pipeline/windows/calibration_select.py`): own first-2 usable windows
- [x] Behavioral feature extraction (`pipeline/features/behavioral.py`): 8 features across 6,191 usable windows, 0 NaNs
- [x] K selection silhouette sweep (`pipeline/clustering/k_selection.py`): optimal K=4 (score 0.4021)
- [x] K-Means clustering (`pipeline/clustering/kmeans_fit.py`): K=4 fitted per window with role annotation
- [x] Chained Hungarian alignment (`pipeline/clustering/alignment.py`): 6,191 aligned rows
- [x] Instability and volatility metrics (`pipeline/instability/metrics.py`): Gate G3 PASSED (first row transitions=2)

### P2 — Forecasting & Statistical Research (Days 5–14, 19)
- [x] Per-household calibration forecaster (`pipeline/forecasting/calibration_forecast.py`): Gate G2 PASSED
- [x] Extreme-failure threshold computation (`pipeline/research/extreme_failure.py`): 95th pct threshold = 2.53438 (Gate G6)
- [x] Error standardization with MAD floor (`pipeline/forecasting/error_standardization.py`)
- [x] Global demand forecaster (`pipeline/forecasting/global_forecaster.py`): Gates G4 & G5 PASSED (14.8M predictions, lag features restored per v4 §7)
- [x] Per-cluster comparison forecaster (`pipeline/forecasting/cluster_forecaster.py`): capstone-only, isolated from research table
- [x] Research table construction (`pipeline/research/build_research_table.py`): 4,288 rows (3,676 Analysis, 612 Holdout)
- [x] Statistical analysis (`pipeline/research/statistical_model.py`): cluster-robust logistic regression, Gate G6 PASSED (event rate 18.96%), H0 supported (instability OR=0.9183, p=0.7481; volatility OR=7.4459, p<0.0001)
- [x] Forward-only holdout evaluation (`pipeline/research/holdout_eval.py`): 612 eligible holdouts, 0 fit calls, Gate G7 PASSED (ROC-AUC=0.7298, PR-AUC=0.5378, event rate 25.65%, Brier=0.16813, Log Loss=0.51322, DEC-015)

### P3 — Anomaly Detection & SHAP Explainability (Days 16–17)
- [x] Feature-based anomaly explanation (`pipeline/anomaly/explain.py`): standardized z-scores against household baselines, non-SHAP
- [x] Unsupervised Isolation Forest (`pipeline/anomaly/isolation_forest.py`): `anomaly_flags.parquet` (6,191 rows, 310 anomalies at 5.00%)
- [x] Synthetic anomaly injection benchmark (`pipeline/anomaly/synthetic_injection.py`): `anomaly_benchmark.json` (Precision=0.5383, Recall=0.9850, F1=0.6961, ROC-AUC=0.9330)
- [x] TreeSHAP explainability (`pipeline/explainability/shap_forecaster.py`): scoped strictly to global forecaster, `shap_explanations.parquet` (352,512 explained points)

### P4 — Backend, Frontend & RAG Copilot (Days 1–12, 18)
- [x] FastAPI backend router & server (`backend/app/main.py`, `backend/app/api/v1/`): mounted at `/` and `/api/v1`
- [x] Artifact loader service (`backend/app/services/artifact_loader.py`): cached in-memory and PyArrow filtered querying from `data/artifacts/latest`
- [x] Blueprint v2 §F endpoints implemented:
  - `GET /overview`: returns portfolio counts, active anomalies, 4-cluster distribution, manifest timestamp
  - `GET /household/{id}/forecast`: returns series, mae_global, mae_percluster, shap_top_features (404 on invalid HH)
  - `GET /household/{id}/segment`: returns cluster trajectory, current_cluster_id, current_cluster_label
  - `GET /household/{id}/instability`: returns instability series, volatility_cv, reliability_indicator
  - `GET /household/{id}/anomaly`: returns Isolation Forest flags, triggering statistics, z-score, explanation
  - `GET /households`: returns 620-household metadata summary for explorer search
  - `POST /chat`: RAG Copilot endpoint
- [x] Domain knowledge base: 5 markdown documents in `backend/app/services/rag/knowledge_base/`
- [x] Local RAG retriever (`backend/app/services/rag/retriever.py`): TF-IDF cosine similarity over passage chunks
- [x] Copilot tool-calling (`backend/app/services/rag/tools.py`): `get_forecast`, `get_segment`, `get_instability`, `get_anomaly`
- [x] Numeric grounding enforcement (`backend/app/services/rag/grounding.py`): strict numeric traceability check against context
- [x] React 19 + TypeScript + Vite frontend (`frontend/`): builds cleanly in <500ms
- [x] API client (`frontend/src/services/api.ts`): full TypeScript client connecting React views to FastAPI
- [x] OverviewView: live portfolio KPIs, aggregated demand, 4-cluster distribution
- [x] HouseholdView: live 620-household explorer, actual vs predicted load curve, SHAP feature bars, anomaly feed
- [x] TrajectoryView: live longitudinal transitions, archetype stability rate, Hungarian migration flow
- [x] CopilotView: interactive chat dialogue with grounded responses, executed tool badges, and household picker
- [x] Automated test suite: 58/58 passing pytest tests across all modules

---

## F. IN PROGRESS

- [ ] Demonstration preparation and live walkthrough rehearsal
- [ ] Research write-up methods and results sections

---

## G. NOT STARTED

- [ ] Deployment packaging (Docker / Hugging Face Spaces skeleton)
- [ ] Systematic literature novelty verification search (Master Plan v4 §23)
- [ ] Final capstone report write-up and viva presentation slides

---

## H. BLOCKED

No items are currently blocked. All technical and research pipeline stages are fully implemented, tested, and integrated.

---

## I. OPEN DECISIONS

| ID | Decision | Status | Source |
|---|---|---|---|
| DEC-008 | UI reliability-indicator cosmetic bucketing thresholds (instability <=0.25 stable, 0.25-0.60 moderate, >0.60 elevated_risk) | DECIDED | Blueprint v2 Revision Log §Remaining OPEN Items; DECISIONS.md |
| DEC-009 | Local RAG retriever using TF-IDF and cosine similarity for fully offline, zero-external-dependency execution | DECIDED | Blueprint v2 §H; DECISIONS.md |
| DEC-010 | Holdout evaluation governance guard & archive protocol (skip holdout on model rerun) | DECIDED | Master Plan v4 §4.5, Contract §8; DECISIONS.md |
| DEC-011 | Physical absence of 5 metadata households in raw block CSVs documented | DECIDED | UKPN dataset structure audit; DECISIONS.md |
| DEC-012 | Deliberate Isolation Forest contamination=0.05 parameter (industry tail budget) | DECIDED | Master Plan v4 §10, Blueprint v2 §C.7; DECISIONS.md |
| DEC-013 | ACORN-U minimum stratification floor raised from 5 to 15 (proportional was no-op) | DECIDED | Master Plan v4 §3.6; DECISIONS.md |
| DEC-014 | Global forecaster lag features addition strictly derived from window <= w | DECIDED | Master Plan v4 §7; DECISIONS.md |
| DEC-015 | Holdout re-execution on corrected post-lag-fix model (pre-fix retired, code guard locked) | DECIDED | Master Plan v4 §4.5, Contract §8; DECISIONS.md |
| DEC-016 | Formal closure of extreme-failure-rate investigation (Candidate c: winter demand expansion limitation) | DECIDED | Master Plan v4 §8.5–8.8; DECISIONS.md |
| OPEN-2 | Literature novelty verification search documentation (non-blocking for implementation, blocks novelty claims in paper) | OPEN | Master Plan v4 §23; Handoff §22 |

---

## J. NEXT EXECUTION MILESTONE

**Final Packaging & Write-up**
1. Rehearse live demonstration (Overview → Household Explorer → Trajectory → Copilot).
2. Document systematic literature novelty search in write-up draft.
3. Complete final capstone report and presentation slides.


---

## K. NOTATION

| Label | Meaning |
|---|---|
| LOCKED | Fixed by Master Plan v4; not open for revision |
| VERIFIED | Empirically confirmed against real data |
| DERIVED | Only implementation consistent with v4's text; not a free choice |
| IMPLEMENTED | Code exists in the repository and produces output |
| TESTED | Automated test suite passes |
| INTEGRATED | Verified end-to-end with upstream/downstream modules |
| OPEN | Genuine ambiguity not settled by v4 |
| BLOCKED | Cannot proceed without resolving a dependency |
