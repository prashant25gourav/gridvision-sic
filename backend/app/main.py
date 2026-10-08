import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Enable CORS for local frontend development (e.g. Vite on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# Include modular v1 API router under /api/v1 and directly at root for compatibility
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router)

# Mount frontend static build if present (for single-container deployment)
static_candidates = [
    Path(os.getenv("STATIC_DIR", "")) if os.getenv("STATIC_DIR") else None,
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path("frontend/dist"),
    Path("/app/frontend/dist"),
]

static_dir = next((p for p in static_candidates if p is not None and p.exists() and (p / "index.html").exists()), None)

if static_dir is not None:
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to GridVision API",
            "docs": "/docs",
            "health": "/health",
            "version": settings.VERSION,
        }


