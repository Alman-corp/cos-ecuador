"""
Agente Comercial — Especialista en ventas, CRM y pipeline.
"""
from typing import TypedDict, List, Annotated
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
import operator

from tools.commercial_tools import (
    get_pipeline_summary, list_opportunities, get_opportunity_details,
    score_lead, match_consultant_to_client, generate_proposal_outline,
    forecast_revenue, get_client_360,
)
from tools.rag_tool import search_tax_documents


class CommercialAgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    tenant_id: str
    client_id: str
    context: dict


class CommercialAgent:
    SYSTEM_PROMPT = """Eres un director comercial senior especializado en venta consultiva
B2B de servicios profesionales (consultoría, auditoría, M&A).

REGLAS ESTRICTAS:
1. SIEMPRE usa las tools para datos del pipeline y clientes. No inventes cifras.
2. Para scoring de leads, usa criterios MEDDIC: Metrics, Economic buyer,
   Decision criteria, Decision process, Identify pain, Champion.
3. En propuestas, incluye: problema del cliente, solución, valor económico,
   diferenciadores, timeline, pricing.
4. Al recomendar pricing, considera valor entregado y capacidad de pago.
5. En forecast, distingue committed vs. pipeline.
6. Identifica siempre la "próxima mejor acción" para cada deal.

FORMATO:
- Para pipeline: tablas Kanban-style por etapa
- Para scoring: tabla de criterios con puntaje
- Para propuestas: estructura de 7 secciones
- SIEMPRE incluye "🎯 Acción recomendada" al final
"""

    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.3)
        self.tools = [
            get_pipeline_summary, list_opportunities, get_opportunity_details,
            score_lead, match_consultant_to_client, generate_proposal_outline,
            forecast_revenue, get_client_360, search_tax_documents,
        ]
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(CommercialAgentState)
        workflow.add_node("agent", self._call_agent)
        workflow.add_node("tools", ToolNode(self.tools))
        workflow.set_entry_point("agent")
        workflow.add_conditional_edges("agent", self._should_continue, {"continue": "tools", "end": END})
        workflow.add_edge("tools", "agent")
        return workflow.compile()

    def _call_agent(self, state: CommercialAgentState) -> CommercialAgentState:
        messages = state["messages"]
        system_message = BaseMessage(role="system", content=self.SYSTEM_PROMPT)
        response = self.llm_with_tools.invoke([system_message] + messages)
        return {"messages": [response]}

    def _should_continue(self, state: CommercialAgentState) -> str:
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "continue"
        return "end"

    async def invoke(self, query: str, tenant_id: str, client_id: str) -> dict:
        initial = {
            "messages": [HumanMessage(content=query)],
            "tenant_id": tenant_id, "client_id": client_id, "context": {},
        }
        final = await self.graph.ainvoke(initial)
        final_msg = final["messages"][-1]
        tools_used = [m.name for m in final["messages"] if hasattr(m, "name") and m.name]
        return {
            "answer": final_msg.content, "sources": [],
            "tools_used": list(set(tools_used)), "confidence": 0.88, "agent_used": "commercial",
        }


_commercial_agent_instance = None

def get_commercial_agent() -> CommercialAgent:
    global _commercial_agent_instance
    if _commercial_agent_instance is None:
        _commercial_agent_instance = CommercialAgent()
    return _commercial_agent_instance
