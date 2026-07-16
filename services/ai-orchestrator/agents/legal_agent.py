"""
Agente Legal — Especialista en contratos, obligaciones y compliance Ecuador.
"""
from typing import TypedDict, List, Annotated
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
import operator

from tools.legal_tools import (
    get_contract_summary, list_client_contracts, get_upcoming_obligations,
    analyze_contract_risk, search_legal_framework, get_compliance_checklist,
    compare_contract_versions,
)
from tools.rag_tool import search_tax_documents


class LegalAgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    tenant_id: str
    client_id: str
    context: dict


class LegalAgent:
    SYSTEM_PROMPT = """Eres un abogado senior especializado en derecho ecuatoriano:
- Derecho civil y comercial (Código Civil, Código de Comercio)
- Derecho laboral (Código del Trabajo, IESS)
- Contratos mercantiles y de servicios
- Protección de datos (LOPDP)
- Compliance corporativo

REGLAS ESTRICTAS:
1. SIEMPRE cita el artículo específico de la ley aplicable.
2. Si una pregunta requiere asesoría legal vinculante, advierte que tu
   respuesta es orientativa y recomienda consultar con un abogado licenciado.
3. Para análisis de riesgo, usa escala: ALTO (🔴), MEDIO (🟡), BAJO (🟢).
4. Al identificar cláusulas problemáticas, sugiere redacción alternativa.
5. En obligaciones contractuales, indica consecuencias de incumplimiento.
6. Usa lenguaje jurídico preciso pero comprensible para no-abogados.

ADVERTENCIA LEGAL OBLIGATORIA:
Al final de cada respuesta, agrega:
"⚖️ *Nota: Esta respuesta es orientativa y no constituye asesoría legal
vinculante. Para decisiones críticas, consulte con un abogado licenciado en Ecuador.*"
"""

    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
        self.tools = [
            get_contract_summary, list_client_contracts, get_upcoming_obligations,
            analyze_contract_risk, search_legal_framework, get_compliance_checklist,
            compare_contract_versions, search_tax_documents,
        ]
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(LegalAgentState)
        workflow.add_node("agent", self._call_agent)
        workflow.add_node("tools", ToolNode(self.tools))
        workflow.set_entry_point("agent")
        workflow.add_conditional_edges("agent", self._should_continue, {"continue": "tools", "end": END})
        workflow.add_edge("tools", "agent")
        return workflow.compile()

    def _call_agent(self, state: LegalAgentState) -> LegalAgentState:
        messages = state["messages"]
        system_message = BaseMessage(role="system", content=self.SYSTEM_PROMPT)
        response = self.llm_with_tools.invoke([system_message] + messages)
        return {"messages": [response]}

    def _should_continue(self, state: LegalAgentState) -> str:
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
        disclaimer = "\n\n---\n⚖️ *Nota: Esta respuesta es orientativa y no constituye asesoría legal vinculante. Para decisiones críticas, consulte con un abogado licenciado en Ecuador.*"
        tools_used = [m.name for m in final["messages"] if hasattr(m, "name") and m.name]
        return {
            "answer": final_msg.content + disclaimer, "sources": [],
            "tools_used": list(set(tools_used)), "confidence": 0.85, "agent_used": "legal",
        }


_legal_agent_instance = None

def get_legal_agent() -> LegalAgent:
    global _legal_agent_instance
    if _legal_agent_instance is None:
        _legal_agent_instance = LegalAgent()
    return _legal_agent_instance
