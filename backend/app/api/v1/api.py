from fastapi import APIRouter
from app.api.v1.endpoints import system, overview, household, chat

api_router = APIRouter()
api_router.include_router(system.router, prefix="/system", tags=["System"])
api_router.include_router(overview.router, tags=["Overview"])
api_router.include_router(household.router, tags=["Household"])
api_router.include_router(chat.router, tags=["Chat"])
