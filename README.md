# GridVision — Smart Energy Analytics & AI Copilot

**Status:** Fully Implemented & Integrated Research Pipeline and Web Platform  
**Live Status & Verification:** [`docs/current_status/PROJECT_STATE.md`](file:///c:/Users/mukes/Desktop/Prashant/SIC-AI/Capstone%20project/gridvision-sic/docs/current_status/PROJECT_STATE.md)

GridVision is an end-to-end smart grid energy analytics platform and empirical research study examining whether temporal instability in household behavioral-cluster assignments predicts subsequent extreme load-forecast failures, controlling for intrinsic consumption volatility. The platform combines an offline deterministic ML research pipeline, a high-performance FastAPI service layer, an interactive glassmorphic React frontend, and a grounded AI Operations Copilot.

---

## 🏛️ System Architecture

GridVision follows the two-tier architecture specified in **Implementation Blueprint v2 §A**:

```text
gridvision-sic/
├── pipeline/             # Offline ML & research pipeline (P1, P2, P3)
│   ├── ingestion/        # Flat-rate conversion & household metadata joining
│   ├── quality/          # 0-negatives, >=95% slot fill, <=3-day gap validation
│   ├── windows/          # 14 common-calendar 56-day windows & calibration assignment
│   ├── sampling/         # Stratified sampling (620 HH, seed=42, ACORN-U protected)
│   ├── features/         # 8 behavioral load-curve features per usable window
│   ├── clustering/       # K-Means clustering (K=4) & Hungarian temporal alignment
│   ├── instability/      # Persistence, instability, and historical volatility (CV)
│   ├── forecasting/      # Pooled global forecaster & per-household calibration
│   ├── anomaly/          # Isolation Forest & synthetic anomaly injection benchmarks
│   ├── explainability/   # TreeSHAP feature attributions on global forecaster
│   ├── research/         # Research table, cluster-robust logit, holdout evaluation
│   └── run_pipeline.py   # Deterministic pipeline orchestration entrypoint
├── backend/              # Production FastAPI application (P4)
│   └── app/
│       ├── api/v1/       # REST endpoints (/overview, /household/{id}/*, /chat)
│       └── services/     # Artifact caching, PyArrow pushdown querying, RAG engine
├── frontend/             # React 19 + TypeScript + Vite UI (P4)
│   └── src/
│       ├── components/   # Overview, Dashboard Workspaces, Charts, Layout
│       ├── services/     # Typed API client
│       └── types/        # Energy and dashboard interfaces
├── data/
│   ├── raw/              # Low Carbon London dataset (hhblock_dataset, metadata)
│   ├── interim/          # Partitioned Parquet blocks
│   └── artifacts/        # Run-versioned Parquet and JSON pipeline outputs
└── docs/                 # Authoritative master plans and live project state
```

---

## 🧭 Application Workspaces & Views

1. **Overview Gateway**: Single-page product introduction and technical architecture overview with 3-tier hierarchy, covering forecasting formulation, behavioral segmentation, anomaly screening, Copilot orchestration, and the research extension.
2. **Demand Snapshot**: Portfolio KPIs, total consumption (MWh), peak load and timing, average demand, and operational attention counters across 14 observation windows.
3. **Demand Analysis**: Diurnal load curves across 48 half-hour slots, weekday vs. weekend demand comparison, 14-window longitudinal trajectory, and seasonal load dynamics.
4. **Consumer Intelligence**: Meter ranking directory (by peak load, forecast error, anomaly count, or instability) with comprehensive individual household drill-down and Hungary-aligned behavioral load profiles.
5. **Anomaly Analysis**: Unsupervised Isolation Forest screening timeline, severity classifications, and affected consumer roster with recommended operational guidance.
6. **Demand Forecasting**: 24-hour horizon day-ahead demand predictions with LightGBM, comparing actual vs. predicted load, error metrics, and confidence distributions.
7. **AI Operations Copilot**: Natural-language operational assistant combining deterministic analytical tool retrieval with RAG domain knowledge guidance, featuring 100% strict numeric grounding verification.
8. **Research Extension**: Controlled empirical evaluation testing whether behavioral cluster instability prospectively predicts extreme load-forecast failure after controlling for intrinsic consumption volatility.

---

## 🚀 Getting Started

### 1. Run the ML & Research Pipeline
```bash
# Execute deterministic pipeline end-to-end
python -m pipeline.run_pipeline
```
Outputs are written to `data/artifacts/run_<timestamp>/` and symlinked to `data/artifacts/latest/`.

### 2. Launch the Backend API (FastAPI)
```bash
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
- Health Check: `GET http://localhost:8000/health`
- Interactive API Docs: `GET http://localhost:8000/docs`

### 3. Launch the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

Build check:
```bash
cd frontend
npm run build
```

---

## 🧪 Testing

Run the automated test suite covering all gates, schemas, and isolation invariants:
```bash
pytest -v
```

---

## 📚 Project Documentation

- **Live Status:** [`docs/current_status/PROJECT_STATE.md`](file:///c:/Users/mukes/Desktop/Prashant/SIC-AI/Capstone%20project/gridvision-sic/docs/current_status/PROJECT_STATE.md)
- **Live Task List:** [`docs/current_status/TASKS.md`](file:///c:/Users/mukes/Desktop/Prashant/SIC-AI/Capstone%20project/gridvision-sic/docs/current_status/TASKS.md)
- **Architecture & Contracts:** `docs/gridvision_master_files/GridVision_IMPLEMENTATION_BLUEPRINT_v2.md`
- **Research Methodology:** `docs/gridvision_master_files/GridVision_FINAL_MASTER_PLAN_v4.docx`