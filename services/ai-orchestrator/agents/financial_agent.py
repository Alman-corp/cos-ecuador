"""
Agente Financiero — Especialista en análisis financiero, valuación y M&A.
"""
from typing import TypedDict, List, Annotated
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
import operator

from tools.financial_tools import (
    get_financial_ratios,
    run_dcf_valuation,
    run_monte_carlo_simulation,
    get_cash_projection,
    calculate_synergies,
    get_financial_statements,
    compare_with_benchmark,
    detect_financial_anomalies,
)
from tools.rag_tool import search_tax_documents


class FinancialAgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    tenant_id: str
    client_id: str
    context: dict


class FinancialAgent:
    SYSTEM_PROMPT = """Eres un analista financiero senior especializado en:
- Valuación de empresas (DCF, múltiplos, sinergias M&A)
- Análisis de estados financieros y ratios
- Proyecciones financieras y simulación de escenarios
- Diagnóstico de salud financiera y detección de riesgos

REGLAS ESTRICTAS:
1. SIEMPRE usa las tools para cálculos. NUNCA calcules mentalmente cifras complejas.
2. Cita las fuentes ISD cuando uses información de documentos del cliente.
3. Usa terminología financiera precisa pero explica conceptos técnicos.
4. Para valuaciones, SIEMPRE presenta rangos (no un solo número).
5. Al dar recomendaciones, indica el nivel de confianza (alto/medio/bajo).
6. Si detectas anomalías o riesgos, marca con ⚠️ y explica el impacto.
7. Al comparar con benchmark, indica el percentil donde se ubica el cliente.
8. Incluye siempre "📚 Fuentes:" al final cuando uses RAG.

FORMATO DE RESPUESTA:
- Usa markdown con tablas para ratios y comparaciones
- Para valuaciones: tabla con escenario base/optimista/pesimista
- Para cash flow: timeline mensual con alertas
- Siempre incluye "Próximos pasos sugeridos" con acciones concretas
"""

    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
        self.tools = [
            get_financial_ratios, run_dcf_valuation, run_monte_carlo_simulation,
            get_cash_projection, calculate_synergies, get_financial_statements,
            compare_with_benchmark, detect_financial_anomalies, search_tax_documents,
        ]
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(FinancialAgentState)
        workflow.add_node("agent", self._call_agent)
        workflow.add_node("tools", ToolNode(self.tools))
        workflow.set_entry_point("agent")
        workflow.add_conditional_edges("agent", self._should_continue, {"continue": "tools", "end": END})
        workflow.add_edge("tools", "agent")
        return workflow.compile()

    def _call_agent(self, state: FinancialAgentState) -> FinancialAgentState:
        messages = state["messages"]
        system_message = BaseMessage(role="system", content=self.SYSTEM_PROMPT)
        response = self.llm_with_tools.invoke([system_message] + messages)
        return {"messages": [response]}

    def _should_continue(self, state: FinancialAgentState) -> str:
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
        sources = []
        for msg in final["messages"]:
            if hasattr(msg, "additional_kwargs") and "sources" in msg.additional_kwargs:
                sources.extend(msg.additional_kwargs["sources"])
        return {
            "answer": final_msg.content, "sources": sources,
            "tools_used": list(set(tools_used)), "confidence": 0.9, "agent_used": "financial",
        }


_financial_agent_instance = None

def get_financial_agent() -> FinancialAgent:
    global _financial_agent_instance
    if _financial_agent_instance is None:
        _financial_agent_instance = FinancialAgent()
    return _financial_agent_instance
