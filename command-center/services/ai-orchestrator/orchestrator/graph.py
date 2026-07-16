from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import TypedDict, Annotated, List, Optional, Literal
import operator
from pydantic import BaseModel
from enum import Enum

from .agents.financial import FinancialAnalystAgent
from .agents.tax import TaxAgentEcuador
from .agents.legal import LegalAgent
from .agents.commercial import CommercialAgent
from .agents.synthesis import DocumentSynthesizerAgent


class AgentIntent(str, Enum):
    FINANCE = "finance"
    TAX = "tax"
    LEGAL = "legal"
    COMMERCIAL = "commercial"
    SYNTHESIS = "synthesis"
    UNKNOWN = "unknown"


class OrchestratorState(TypedDict):
    messages: Annotated[List, operator.add]
    intent: Optional[AgentIntent]
    confidence: float
    sources: List[str]
    tenant_id: str
    user_id: str
    requires_human_review: bool
    token_usage: dict
    cost_usd: float
    latency_ms: int


class RouterAgent:
    SYSTEM_PROMPT = """Eres un router de intenciones para una plataforma de consultoría en Ecuador.

Tu única tarea es clasificar la consulta del usuario en UNA de estas categorías:
- finance: Valuación, DCF, Monte Carlo, ratios financieros, M&A, estructura de capital
- tax: IVA, retenciones, SRI, calendario fiscal, anexos tributarios, RUC
- legal: Contratos, cláusulas, obligaciones legales, firmas
- commercial: Pipeline de ventas, scoring de leads, pricing, propuestas
- synthesis: Resúmenes de documentos, generación de reportes, análisis multi-documento
- unknown: No encaja en ninguna categoría

Responde SOLO con el nombre de la categoría, sin explicaciones."""

    def __init__(self, llm):
        self.llm = llm

    async def route(self, state: OrchestratorState) -> OrchestratorState:
        last_message = state["messages"][-1].content
        response = await self.llm.ainvoke([
            SystemMessage(content=self.SYSTEM_PROMPT),
            HumanMessage(content=last_message)
        ])
        intent_text = response.content.strip().lower()
        intent_map = {
            "finance": AgentIntent.FINANCE,
            "tax": AgentIntent.TAX,
            "legal": AgentIntent.LEGAL,
            "commercial": AgentIntent.COMMERCIAL,
            "synthesis": AgentIntent.SYNTHESIS,
        }
        intent = intent_map.get(intent_text, AgentIntent.UNKNOWN)
        confidence = 0.9 if intent != AgentIntent.UNKNOWN else 0.3
        return {
            **state,
            "intent": intent,
            "confidence": confidence,
            "messages": [AIMessage(content=f"Enrutado a agente: {intent.value}")],
        }


class QualityCheckerAgent:
    EVALUATION_PROMPT = """Evalúa esta respuesta de un agente IA según 4 criterios (0-1 cada uno):

1. Relevancia: ¿Responde directamente la pregunta del usuario?
2. Precisión: ¿Los datos financieros/tributarios son correctos?
3. Trazabilidad: ¿Cada afirmación tiene fuente verificable (ISD)?
4. Completitud: ¿Cubre todos los aspectos importantes?

Responde en JSON:
{
  "relevance": 0.0-1.0,
  "precision": 0.0-1.0,
  "traceability": 0.0-1.0,
  "completeness": 0.0-1.0,
  "overall": 0.0-1.0,
  "requires_human_review": true/false,
  "feedback": "comentario breve"
}"""

    def __init__(self, llm):
        self.llm = llm

    async def evaluate(self, state: OrchestratorState) -> OrchestratorState:
        agent_response = state["messages"][-1].content
        user_query = next(
            (m.content for m in reversed(state["messages"]) if isinstance(m, HumanMessage)),
            ""
        )
        evaluation = await self.llm.ainvoke([
            SystemMessage(content=self.EVALUATION_PROMPT),
            HumanMessage(content=f"""
Pregunta del usuario: {user_query}

Respuesta del agente: {agent_response}

Fuentes citadas: {state.get("sources", [])}
""")
        ])
        import json
        try:
            scores = json.loads(evaluation.content)
            overall = scores.get("overall", 0.5)
            requires_review = scores.get("requires_human_review", overall < 0.8)
        except Exception:
            overall = 0.5
            requires_review = True
        return {
            **state,
            "confidence": overall,
            "requires_human_review": requires_review,
        }


def build_orchestrator_graph(
    router_agent: RouterAgent,
    financial_agent: FinancialAnalystAgent,
    tax_agent: TaxAgentEcuador,
    legal_agent: LegalAgent,
    commercial_agent: CommercialAgent,
    synthesis_agent: DocumentSynthesizerAgent,
    quality_checker: QualityCheckerAgent,
):
    workflow = StateGraph(OrchestratorState)

    workflow.add_node("router", router_agent.route)
    workflow.add_node("financial_analyst", financial_agent.process)
    workflow.add_node("tax_agent", tax_agent.process)
    workflow.add_node("legal_agent", legal_agent.process)
    workflow.add_node("commercial_agent", commercial_agent.process)
    workflow.add_node("document_synthesizer", synthesis_agent.process)
    workflow.add_node("quality_checker", quality_checker.evaluate)
    workflow.add_node("human_review", lambda state: state)

    workflow.add_conditional_edges(
        "router",
        lambda state: state["intent"],
        {
            AgentIntent.FINANCE: "financial_analyst",
            AgentIntent.TAX: "tax_agent",
            AgentIntent.LEGAL: "legal_agent",
            AgentIntent.COMMERCIAL: "commercial_agent",
            AgentIntent.SYNTHESIS: "document_synthesizer",
            AgentIntent.UNKNOWN: "document_synthesizer",
        }
    )

    for agent_node in ["financial_analyst", "tax_agent", "legal_agent", "commercial_agent", "document_synthesizer"]:
        workflow.add_edge(agent_node, "quality_checker")

    workflow.add_conditional_edges(
        "quality_checker",
        lambda state: "human_review" if state["requires_human_review"] else END,
        {"human_review": "human_review", END: END},
    )

    workflow.add_edge("human_review", END)
    workflow.set_entry_point("router")

    return workflow.compile()


def create_orchestrator(config: dict):
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic

    llm_fast = ChatAnthropic(model="claude-3-haiku-20240307", temperature=0)
    llm_powerful = ChatOpenAI(model="gpt-4o", temperature=0.2)
    llm_judge = ChatOpenAI(model="gpt-4o", temperature=0)

    router = RouterAgent(llm_fast)
    quality_checker = QualityCheckerAgent(llm_judge)

    financial = FinancialAnalystAgent(llm_powerful, config)
    tax = TaxAgentEcuador(llm_powerful, config)
    legal = LegalAgent(llm_powerful, config)
    commercial = CommercialAgent(llm_powerful, config)
    synthesis = DocumentSynthesizerAgent(llm_powerful, config)

    graph = build_orchestrator_graph(
        router, financial, tax, legal, commercial, synthesis, quality_checker
    )
    return graph
