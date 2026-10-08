"""Chat Copilot Endpoint.

Implements POST /chat.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.rag.agent import run_copilot_turn

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., description="User query or instruction", min_length=1)
    household_id: Optional[str] = Field(None, description="Optional target household identifier")


class ToolCallItem(BaseModel):
    tool: str
    args: Dict[str, Any]


class ChatResponse(BaseModel):
    answer: str
    tool_calls: List[ToolCallItem]
    grounded: bool
    debug: Optional[Dict[str, Any]] = None


@router.post("/chat", response_model=ChatResponse)
def chat_copilot(req: ChatRequest):
    """Process user message via RAG Copilot with tool calling and strict numeric grounding."""
    res = run_copilot_turn(message=req.message, household_id=req.household_id)
    return res
