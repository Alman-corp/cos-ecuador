from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from enum import Enum


# --- Enums ---

class AgentType(str, Enum):
    ORCHESTRATOR = "ORCHESTRATOR"
    FINANCIAL = "FINANCIAL"
    TAX = "TAX"
    LEGAL = "LEGAL"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DocumentType(str, Enum):
    BALANCE_SHEET = "BALANCE_SHEET"
    INCOME_STATEMENT = "INCOME_STATEMENT"
    CASH_FLOW = "CASH_FLOW"
    TAX_RETURN = "TAX_RETURN"
    SRI_XML = "SRI_XML"
    CONTRACT = "CONTRACT"
    OTHER = "OTHER"


# --- Agent Messages ---

class AgentMessage(BaseModel):
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    agent_type: Optional[AgentType] = None
    tool_calls: Optional[list[dict]] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class AgentState(BaseModel):
    messages: list[AgentMessage] = []
    tenant_id: str
    session_id: str
    context: dict = Field(default_factory=dict)
    next_agents: list[AgentType] = []
    findings: list[dict] = Field(default_factory=list)
    alert_level: RiskLevel = RiskLevel.LOW


# --- Financial Tools I/O ---

class BalanceSheetInput(BaseModel):
    total_assets: float
    current_assets: float
    cash_and_equivalents: float
    accounts_receivable: float
    inventory: float
    total_liabilities: float
    current_liabilities: float
    short_term_debt: float
    long_term_debt: float
    equity: float
    revenue: float
    net_income: float


class FinancialRatios(BaseModel):
    current_ratio: float
    quick_ratio: float
    debt_to_equity: float
    return_on_assets: float
    return_on_equity: float
    net_margin: float
    alert: Optional[str] = None
    alert_level: RiskLevel = RiskLevel.LOW


class MonteCarloInput(BaseModel):
    initial_cash: float = 500000
    monthly_revenue_mean: float = 200000
    monthly_revenue_std: float = 40000
    monthly_opex_mean: float = 150000
    monthly_opex_std: float = 20000
    months: int = 6
    simulations: int = 10000
    confidence_level: float = 0.95


class MonteCarloResult(BaseModel):
    median_runway_months: float
    probability_runway_gt_6_months: float
    probability_runway_lt_3_months: float
    cash_at_6_months_p10: float
    cash_at_6_months_p50: float
    cash_at_6_months_p90: float
    alert_level: RiskLevel


class DCFInput(BaseModel):
    free_cash_flows: list[float]
    terminal_growth_rate: float = 0.03
    wacc: float = 0.12
    net_debt: float = 0
    cash_and_equivalents: float = 0


class DCFResult(BaseModel):
    enterprise_value: float
    equity_value: float
    pv_of_cash_flows: float
    pv_of_terminal_value: float
    terminal_value: float


# --- Tax Tools I/O ---

class SRIAnnexeLine(BaseModel):
    tipo_comprobante: str
    fecha_emision: str
    identificacion: str
    nombre: str
    base_imponible: float
    iva: float
    retencion_iva: Optional[float] = 0
    retencion_renta: Optional[float] = 0


class TaxCrossCheckInput(BaseModel):
    sales_annexe: list[SRIAnnexeLine]
    purchases_annexe: list[SRIAnnexeLine]


class TaxDiscrepancy(BaseModel):
    type: str
    description: str
    amount: float
    severity: RiskLevel
    recommendation: str


class TaxCrossCheckResult(BaseModel):
    total_discrepancies: int
    total_risk_amount: float
    discrepancies: list[TaxDiscrepancy]
    alert_level: RiskLevel


# --- Orchestrator I/O ---

class OrchestratorInput(BaseModel):
    tenant_id: str
    session_id: str
    message: str
    document_ids: Optional[list[str]] = None
    context: Optional[dict] = None


class OrchestratorOutput(BaseModel):
    response: str
    next_agents: list[AgentType]
    findings: list[dict]
    alert_level: RiskLevel
    session_id: str


class AgentQuery(BaseModel):
    tenant_id: str
    session_id: str
    agent_type: AgentType
    query: str
    context: Optional[dict] = None


class AgentResponse(BaseModel):
    agent_type: AgentType
    response: str
    data: Optional[dict] = None
    findings: list[dict] = []
    alert_level: RiskLevel = RiskLevel.LOW
