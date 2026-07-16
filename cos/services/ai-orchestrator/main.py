"""COS AI Orchestrator — FastAPI Server.

Exposes:
  POST /api/v1/analyze   — Analyze a document via LangGraph agents
  POST /api/v1/chat      — Multi-turn conversation with agent swarm
  POST /api/v1/monte-carlo — Run Monte Carlo cashflow simulation
  GET  /health           — Health check
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.api import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    DcfRequest,
    DcfResponse,
    HealthResponse,
    MonteCarloRequest,
    MonteCarloResponse,
)
from agents.orchestrator import OrchestratorAgent


_orchestrator: OrchestratorAgent | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _orchestrator
    _orchestrator = OrchestratorAgent()
    print("COS Orchestrator ready")
    yield
    print("COS Orchestrator shutting down")


app = FastAPI(
    title="COS AI Orchestrator",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_orch() -> OrchestratorAgent:
    if _orchestrator is None:
        msg = "Orchestrator not initialized"
        raise RuntimeError(msg)
    return _orchestrator


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", service="cos-ai-orchestrator")


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """Route a document to the appropriate specialist agents."""
    orch = _get_orch()
    return await orch.run(req)


@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Multi-turn conversation routed by intent keywords."""
    orch = _get_orch()
    return await orch.chat(req)


@app.post("/api/v1/monte-carlo", response_model=MonteCarloResponse)
async def monte_carlo(req: MonteCarloRequest):
    """Run Monte Carlo simulation server-side."""
    orch = _get_orch()
    return await orch.run_monte_carlo(req)


@app.post("/api/v1/dcf", response_model=DcfResponse)
async def dcf(req: DcfRequest):
    """Run DCF valuation server-side."""
    orch = _get_orch()
    return await orch.run_dcf(req)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
