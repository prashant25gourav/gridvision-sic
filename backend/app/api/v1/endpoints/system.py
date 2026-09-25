from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/info")
def get_system_info():
    """Return high-level API metadata and operational readiness."""
    return {
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "research_layer": "pending-masterplan-refinement",
    }
