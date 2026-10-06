.PHONY: setup ingest pipeline backend frontend e2e-smoke test

# 1. Setup environment dependencies
setup:
	python -m pip install --upgrade pip
	python -m pip install -r backend/requirements.txt
	cd frontend && npm install

# 2. Ingest raw CSV blocks to interim Parquet blocks
ingest:
	python -m pipeline.run_pipeline --full-ingestion --pilot

# 3. Execute offline ML & research pipeline end-to-end
pipeline:
	python -m pipeline.run_pipeline --include-p2 --include-p3

# 4. Launch FastAPI backend service
backend:
	python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload

# 5. Launch frontend development server
frontend:
	cd frontend && npm run dev

# 6. Execute end-to-end smoke tests
e2e-smoke:
	pytest -v

test: e2e-smoke
