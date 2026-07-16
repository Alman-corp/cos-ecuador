from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import time
import os

from orchestrator.graph import create_orchestrator, OrchestratorState
from langchain_core.messages import HumanMessage
from api.financial import router as financial_router

app = FastAPI(
    title="COS AI Orchestrator",
    description="Orquestador multiagente para consultoría en Ecuador",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = None

app.include_router(financial_router)


@app.on_event("startup")
async def startup_event():
    global orchestrator
    from config import get_config
    orchestrator = create_orchestrator(get_config())


class ChatRequest(BaseModel):
    message: str
    tenant_id: str
    user_id: str
    agent_type: Optional[str] = None
    document_ids: Optional[List[str]] = None


class ChatResponse(BaseModel):
    response: str
    sources: List[dict]
    intent: str
    confidence: float
    cost_usd: float
    latency_ms: int
    requires_human_review: bool


class ISDSource(BaseModel):
    document_id: str
    document_name: str
    page_number: Optional[int]
    chunk_id: str
    text_snippet: str
    confidence: float
    trace_url: str


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_with_agents(request: ChatRequest):
    start_time = time.time()
    try:
        initial_state: OrchestratorState = {
            "messages": [HumanMessage(content=request.message)],
            "intent": None,
            "confidence": 0.0,
            "sources": [],
            "tenant_id": request.tenant_id,
            "user_id": request.user_id,
            "requires_human_review": False,
            "token_usage": {},
            "cost_usd": 0.0,
            "latency_ms": 0,
        }
        final_state = await orchestrator.ainvoke(initial_state)
        latency_ms = int((time.time() - start_time) * 1000)
        response_message = final_state["messages"][-1].content

        return ChatResponse(
            response=response_message,
            sources=[],
            intent=final_state["intent"].value,
            confidence=final_state["confidence"],
            cost_usd=final_state.get("cost_usd", 0.0),
            latency_ms=latency_ms,
            requires_human_review=final_state["requires_human_review"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en orquestador: {str(e)}")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-orchestrator",
        "version": "2.0.0",
        "agents": ["financial", "tax", "legal", "commercial", "synthesis"],
    }
