# GridVision — Smart Energy Analytics & AI Copilot

**Status:** UI Shell & Safe Scaffold Operational (Decoupled from Research Methodology)

GridVision is a smart grid energy analytics platform designed to analyze high-frequency smart meter telemetry, consumer behavioral trajectory clustering, peak demand dynamics, and conversational grid intelligence.

---

## 🏛️ System Architecture

```text
Capstone Project/
├── frontend/          # React 19 + TypeScript + Vite (Glassmorphic dark UI)
│   ├── src/
│   │   ├── components/# Reusable UI cards, badges, pure SVG load & trajectory charts
│   │   ├── views/     # Overview, Household Explorer, Behavioral Trajectory, Copilot
│   │   ├── types/     # Clean domain TypeScript interfaces
│   │   └── mock/      # Realistic smart meter telemetry & archetype mock data
├── backend/           # FastAPI with modular routing and CORS middleware
│   └── app/
│       ├── api/v1/    # Versioned API router (/system/info)
│       ├── core/      # Application settings & CORS config
│       └── main.py    # FastAPI entrypoint (preserves GET /health)
├── ml/                # Safe dataset diagnostic tools (ML models pending masterplan)
│   └── inspect_dataset.py # Read-only smart meter CSV/Parquet inspector
├── data/
│   ├── raw/           # Raw smart meter telemetry files (.gitkeep)
│   └── processed/     # Future cleaned and aggregated tensors (.gitkeep)
└── docs/              # Masterplan, research papers, and methodological specs
```

---

## 🧭 Frontend Navigation Views

1. **Overview Dashboard**: High-level grid operations, 24-hour aggregate load tracking vs baseline, behavioral cluster breakdown, and telemetry alerts.
2. **Household Explorer**: Granular smart meter inspection, demographic Acorn groups, tariff plans, and individual 24-hour load curves.
3. **Behavioral Trajectory**: Longitudinal cluster migration tracking, stability index evaluation, and transition ledger.
4. **GridVision Copilot**: Interactive generative AI assistant simulation with telemetry context chips, suggested inquiries, and operational recommendations.

---

## 🚀 Getting Started

### 1. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

Build check:
```bash
npm run build
npm run lint
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Health Check: `GET http://localhost:8000/health` &rarr; `{"status":"ok"}`
- Interactive Docs: `GET http://localhost:8000/docs`
- System Info: `GET http://localhost:8000/api/v1/system/info`

### 3. Safe Dataset Inspection Utility
Inspect any raw smart meter file safely without training or downloading data:
```bash
# General diagnostic check of data/raw/
python ml/inspect_dataset.py

# Inspect a specific file
python ml/inspect_dataset.py --file data/raw/your_meter_data.csv

# Generate a small 5-meter synthetic sample for offline smoke testing
python ml/inspect_dataset.py --generate-sample
```

---

## 🛡️ Methodological Safety & Decoupling Guard

The following research and methodological parameters are intentionally uncommitted to preserve full flexibility while the research masterplan is finalized:
- Exact forecasting horizon and rolling-window protocol
- Mathematical formulation of behavioral instability
- Exact volatility metrics and extreme-error thresholds
- Cluster alignment algorithm (Hungarian vs Centroid distance)
- Final ML API and RAG tool contracts