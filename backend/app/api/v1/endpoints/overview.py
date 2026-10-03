"""Overview Endpoint (P4).

Implements GET /overview matching Blueprint v2 §F.1.
"""

from fastapi import APIRouter
from app.services.artifact_loader import store

router = APIRouter()


@router.get("/overview")
def get_overview():
    """Return high-level portfolio overview, active anomalies, and cluster distribution."""
    return store.get_overview_data()
