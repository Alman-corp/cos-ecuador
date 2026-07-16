"""Pydantic models for the FastAPI REST endpoints."""

from pydantic import BaseModel, Field
from typing import Any


# ── Health ────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str  # "cos-ai-orchestrator"


# ── Analyze ───────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    tenant_id: str = Field(..., description="Tenant identifier for multi-tenant isolation")
    document_type: str = Field(
        "GENERAL",
        description="BALANCE | TAX_RETURN | CONTRACT | GENERAL (auto-detected)",
    )
    document_text: str = Field(..., description="Raw document text content")
    metadata: dict[str, Any] | None = None


class AgentFinding(BaseModel):
    agent: str = Field(..., description="FINANCIERO | TRIBUTARIO | LEGAL")
    severity: str = Field(..., description="CRITICAL | HIGH | MEDIUM | LOW | INFO")
    title: str
    description: str
    metrics: dict[str, Any] | None = None
    recommendations: list[str] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    status: str  # "success" | "error"
    session_id: str | None = None
    summary: str | None = None
    findings: list[AgentFinding] = Field(default_factory=list)
    overall_risk: str | None = None
    error: str | None = None


# ── Chat ──────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    tenant_id: str
    session_id: str
    message: str
    history: list[ChatMessage] | None = None


class ChatSource(BaseModel):
    document_id: str | None = None
    document_title: str | None = None
    excerpt: str | None = None
    confidence: float | None = None


class ChatResponse(BaseModel):
    status: str
    session_id: str | None = None
    response: str | None = None
    sources: list[ChatSource] = Field(default_factory=list)
    agent_used: str | None = None
    error: str | None = None


# ── Monte Carlo ───────────────────────────────────────────

class MonteCarloRequest(BaseModel):
    initial_cash: float = Field(default=500_000, ge=0)
    monthly_revenue_mean: float = Field(default=200_000, ge=0)
    monthly_revenue_std: float = Field(default=40_000, ge=0)
    monthly_opex_mean: float = Field(default=150_000, ge=0)
    monthly_opex_std: float = Field(default=20_000, ge=0)
    months: int = Field(default=6, ge=1, le=60)
    simulations: int = Field(default=10_000, ge=1_000, le=100_000)
    confidence_level: float = Field(default=0.95, ge=0.5, le=0.999)


class MonteCarloResponse(BaseModel):
    median_runway_months: float
    probability_survive_6_months: float
    probability_default_3_months: float
    cash_at_6m_p10: float
    cash_at_6m_p50: float
    cash_at_6m_p90: float
    alert_level: str


# ── DCF ────────────────────────────────────────────

class DcfRequest(BaseModel):
    free_cash_flows: list[float] = Field(..., description="Projected FCFs for each year (5 years typical)")
    terminal_growth_rate: float = Field(default=0.03, ge=0, le=0.1, description="Perpetual growth rate")
    wacc: float = Field(default=0.12, gt=0, le=0.3, description="Weighted Average Cost of Capital")
    net_debt: float = Field(default=0.0, description="Total debt minus cash")
    cash_and_equivalents: float = Field(default=0.0, description="Cash and equivalents to add back")


class DcfResponse(BaseModel):
    enterprise_value: float
    equity_value: float
    pv_of_cash_flows: float
    pv_of_terminal_value: float
    terminal_value: float
    implied_ev_ebitda: float | None = None
