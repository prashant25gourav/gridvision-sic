# GridVision — Project State (LIVE)

> **Purpose:** This is the single source of truth for what GridVision is ACTUALLY DOING right now.
> It is updated after every meaningful change to the repository.
>
> **Do not confuse this with the master files.** The master files define what GridVision IS.
> This file defines what has ACTUALLY BEEN BUILT and what the current execution state is.

**Last Updated:** 2026-09-27

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

**Overall state: SCAFFOLDING ONLY.**

The repository contains a UI shell and backend skeleton. No ML pipeline, no research pipeline, no data processing, no forecasting, no clustering, no statistical analysis has been implemented. The frontend renders four views using **hardcoded mock data only** — it is not connected to any real data pipeline or backend API endpoints beyond a health check and system info.

#### Backend (`backend/`)

| Component | Status | Notes |
|---|---|---|
| FastAPI entrypoint (`app/main.py`) | IMPLEMENTED | Health check (`/health`), root (`/`), CORS middleware |
| Config (`app/core/config.py`) | IMPLEMENTED | Basic settings class (project name, version, CORS origins) |
| API router (`app/api/v1/api.py`) | IMPLEMENTED | Single router mounting `system` endpoints |
| System endpoint (`app/api/v1/endpoints/system.py`) | IMPLEMENTED | `GET /system/info` returns app metadata |
| `/forecast` endpoint | NOT STARTED | — |
| `/segment` endpoint | NOT STARTED | — |
| `/instability` endpoint | NOT STARTED | — |
| `/anomaly` endpoint | NOT STARTED | — |
| `/chat` endpoint | NOT STARTED | — |
| Artifact loader service | NOT STARTED | — |
| RAG service (FAISS, retriever, tools) | NOT STARTED | — |
| `requirements.txt` | IMPLEMENTED | Contains `fastapi` and `uvicorn[standard]` only |

#### Frontend (`frontend/`)

| Component | Status | Notes |
|---|---|---|
| Vite + React 19 + TypeScript setup | IMPLEMENTED | `package.json`, `vite.config.ts`, `tsconfig` files |
| App shell (`App.tsx`) | IMPLEMENTED | Tab-based navigation across 4 views |
| Header / Footer layout | IMPLEMENTED | `components/layout/Header.tsx`, `Footer.tsx` |
| Common components | IMPLEMENTED | `Card.tsx`, `Badge.tsx`, `MetricCard.tsx`, `TabNav.tsx` |
| Chart components | IMPLEMENTED | `LoadChart.tsx`, `ClusterBarChart.tsx`, `TrajectoryFlow.tsx` (pure SVG) |
| OverviewView | IMPLEMENTED | Renders mock KPIs, demand chart, cluster distribution, alerts |
| HouseholdView | IMPLEMENTED | Renders mock household profiles with load curves |
| TrajectoryView | IMPLEMENTED | Renders mock behavioral transitions |
| CopilotView | IMPLEMENTED | Simulated chat interface (no real LLM/RAG) |
| TypeScript types (`types/energy.ts`) | IMPLEMENTED | Domain interfaces for metrics, clusters, households, etc. |
| Mock data (`mock/mockData.ts`) | IMPLEMENTED | Hardcoded illustrative data — NOT real research data |
| CSS design system (`index.css`) | IMPLEMENTED | Glassmorphic dark theme with CSS custom properties |
| Connection to real backend data | NOT STARTED | All views use mock data only |
| Recharts integration | NOT STARTED | Current charts are pure SVG; Blueprint specifies Recharts |

#### ML / Pipeline (`ml/`)

| Component | Status | Notes |
|---|---|---|
| `inspect_dataset.py` | IMPLEMENTED | Read-only diagnostic utility for inspecting raw CSV/Parquet files |
| `pipeline/` directory | NOT STARTED | Does not exist in repository |
| Ingestion (`to_parquet.py`) | NOT STARTED | — |
| Data quality checks | NOT STARTED | — |
| Sampling | NOT STARTED | — |
| Window construction | NOT STARTED | — |
| Calibration assignment | NOT STARTED | — |
| Behavioral features | NOT STARTED | — |
| K selection | NOT STARTED | — |
| Clustering (K-Means) | NOT STARTED | — |
| Alignment (Hungarian) | NOT STARTED | — |
| Instability / volatility metrics | NOT STARTED | — |
| Calibration forecasting | NOT STARTED | — |
| Global forecasting | NOT STARTED | — |
| Per-cluster forecasting | NOT STARTED | — |
| Error standardization | NOT STARTED | — |
| Research table construction | NOT STARTED | — |
| Extreme-failure labeling | NOT STARTED | — |
| Statistical model | NOT STARTED | — |
| Holdout evaluation | NOT STARTED | — |
| Anomaly detection (Isolation Forest) | NOT STARTED | — |
| SHAP explainability | NOT STARTED | — |

#### Data (`data/`)

| Component | Status | Notes |
|---|---|---|
| `data/raw/` | EMPTY | `.gitkeep` placeholder only; no raw LCL data present |
| `data/processed/` | EMPTY | `.gitkeep` placeholder only |
| `data/interim/` | NOT STARTED | Does not exist (specified in Blueprint v2 §B) |
| `data/artifacts/` | NOT STARTED | Does not exist (specified in Blueprint v2 §B) |

#### Tests (`tests/`)

| Component | Status | Notes |
|---|---|---|
| `tests/` directory | NOT STARTED | Does not exist in repository |

#### Configuration

| Component | Status | Notes |
|---|---|---|
| `.env.example` (root) | IMPLEMENTED | Basic env template (project name, API prefix, CORS, host/port) |
| `frontend/.env.example` | IMPLEMENTED | Contains `VITE_API_URL` |
| `.gitignore` | IMPLEMENTED | Covers Python, Node, IDE, Jupyter, OS files |
| `config/pipeline.yaml` | NOT STARTED | Does not exist (specified in Blueprint v2 §B) |
| `Makefile` | NOT STARTED | Does not exist (specified in Blueprint v2 §K) |

#### Documentation

| Component | Status | Notes |
|---|---|---|
| `README.md` | IMPLEMENTED | Documents the current scaffold; references "masterplan" but does not point to `docs/gridvision_master_files/` or `docs/current_status/` |
| `docs/gridvision_master_files/` | LOCKED | All 4 master files present |
| `docs/current_status/` | IN PROGRESS | Being populated by this initialization task |

---

## C. TEAM STATUS

| Role | Scope | Current State |
|---|---|---|
| **P1** — Data / Research Pipeline Lead | Ingestion, QC, sampling, common-calendar windows, per-household calibration assignment, behavioral features, K selection / K-Means, cluster alignment / Hungarian matching, instability, volatility | NOT STARTED |
| **P2** — Forecasting / Statistics | Calibration forecaster, global forecaster, per-cluster forecaster (capstone-only), forecast-error standardization, extreme-failure threshold, research table construction, statistical analysis, holdout evaluation | NOT STARTED |
| **P3** — Anomaly / Explainability | Anomaly detection (Isolation Forest, synthetic injection), SHAP (global forecaster only), explainability | NOT STARTED |
| **P4** — Backend / Frontend / RAG | FastAPI backend, React frontend, RAG / Copilot (FAISS + chat), integrating all artifacts into the app | SCAFFOLDING — UI shell and backend skeleton exist |

---

## D. CURRENT PHASE

**Phase: Ready for Day 1 Execution**

The repository contains scaffolding (frontend UI shell, backend skeleton, dataset inspector).
The master files are locked, verified, and reconciled across all four documents.
Living status files (`PROJECT_STATE.md`, `TASKS.md`, `DECISIONS.md`) and agent skills are fully established.
No implementation of the ML/research pipeline or application endpoints has begun.
The project is ready to enter Day 1 of the 20-day execution schedule.

---

## E. COMPLETED

- [x] Master Plan finalized and locked (v4)
- [x] Dataset verification (two rounds against real Kaggle files)
- [x] Per-household calibration design decided and verified
- [x] AI Handoff Context written and locked
- [x] Implementation Blueprint written and self-audited (v2)
- [x] Team Execution Contract written
- [x] Targeted master-document reconciliation pass completed (Issue 1 ownership, Issue 2 acyclic threshold dependency, Issue 3 window usability, Issue 4 holdout predecessor rule)
- [x] Frontend UI shell created (4 views, mock data, glassmorphic theme)
- [x] Backend FastAPI skeleton created (health check, system info endpoint)
- [x] Dataset inspection utility created (`ml/inspect_dataset.py`)
- [x] Repository structure created (basic directories)
- [x] Living project status documents initialized (`docs/current_status/`)
- [x] Agent skills created and aligned (`.agents/skills/`)

---

## F. IN PROGRESS

- None (repository context and pre-Day 1 reconciliation complete; standing by for Day 1 kickoff)

---

## G. NOT STARTED

- [ ] Raw LCL data download and placement in `data/raw/`
- [ ] All 20 days of the execution schedule (Days 1–20)
- [ ] Complete `pipeline/` directory and all modules
- [ ] `tests/` directory and all test suites
- [ ] `config/pipeline.yaml`
- [ ] `Makefile` with pipeline/build targets
- [ ] Real backend API endpoints (`/forecast`, `/segment`, `/instability`, `/anomaly`, `/chat`)
- [ ] Frontend connection to real backend (replacing mock data)
- [ ] RAG knowledge base documents
- [ ] 50-HH integration gate
- [ ] Full-sample run
- [ ] Holdout evaluation
- [ ] Statistical analysis (H1/H0)
- [ ] Demo rehearsal
- [ ] Research write-up

---

## H. BLOCKED

No items are currently blocked.

The one prerequisite for Day 1 is the raw LCL dataset being placed in `data/raw/`. This is a download action, not a technical blocker.

---

## I. OPEN DECISIONS

| ID | Decision | Status | Source |
|---|---|---|---|
| OPEN-1 | UI reliability-indicator bucketing thresholds (display-only, cosmetic) | OPEN | Blueprint v2 Revision Log; Team Execution Contract §Remaining OPEN Items |
| OPEN-2 | Literature novelty verification (non-blocking for implementation) | OPEN | Master Plan v4 §23; Handoff §22 |

---

## J. NEXT EXECUTION MILESTONE

**Days 1–2: Setup**
- Download and place raw LCL data in `data/raw/`
- Implement `pipeline/ingestion/to_parquet.py` — convert raw CSVs to Parquet (P1)
- Implement `pipeline/sampling/stratified_sample.py` — draw fixed 500–800 HH sample (P1)
- P4 can continue building backend/frontend scaffolding against mocked artifacts
- **Gate:** G1 — row/household counts match v4 §3 verified numbers

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
