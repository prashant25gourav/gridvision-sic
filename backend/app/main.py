from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to GridVision API",
        "docs": "/docs",
        "health": "/health",
        "version": settings.VERSION,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# Include modular v1 API router
app.include_router(api_router, prefix=settings.API_V1_STR)
