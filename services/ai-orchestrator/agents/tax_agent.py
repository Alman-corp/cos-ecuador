"""
Agente Tributario especializado en Ecuador.
Usa tools del motor tributario + RAG con legislación SRI.
"""
from typing import TypedDict, List, Annotated, Optional
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
import operator
import json
import httpx

from tools.tributario_tools import (
    get_fiscal_calendar,
    calculate_iva,
    check_obligation_status,
    get_retention_rate,
    search_sri_legislation,
    get_client_tax_profile,
    simulate_tax_scenario,
)
from tools.rag_tool import search_tax_documents


class TaxAgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    tenant_id: str
    client_id: str
    context: dict


class TaxAgent:
    """
    Agente IA especializado en tributario ecuatoriano.

    Capacidades:
    - Responder sobre obligaciones del calendario SRI
    - Calcular IVA, retenciones, renta
    - Explicar artículos de LRTI/RLRTI con citas
    - Simular escenarios tributarios
    - Alertar sobre próximas declaraciones
    """

    SYSTEM_PROMPT = """Eres un asesor tributario especializado en la legislación ecuatoriana.
Tu nombre es "TribuBot" y formas parte del COS (Consulting Operating System).

REGLAS ESTRICTAS:
1. SIEMPRE cita el artículo específico de la ley (LRTI, RLRTI, resoluciones SRI).
2. Si no estás seguro, indica claramente que la respuesta requiere validación con un contador.
3. NUNCA des consejos que puedan interpretarse como evasión fiscal.
4. Usa los datos reales del cliente (RUC, obligaciones, facturación) cuando estén disponibles.
5. Responde en español de Ecuador, formal pero accesible.
6. Si el usuario pregunta sobre obligaciones próximas, usa SIEMPRE el tool get_fiscal_calendar.
7. Para cálculos, usa las tools en lugar de calcular mentalmente.
8. Para preguntas sobre artículos específicos de la ley o interpretación normativa, usa search_tax_documents (RAG con ISD) para obtener citas precisas.

FORMATO DE RESPUESTA:
- Usa markdown con headings
- Incluye tablas cuando compares escenarios
- Al final, agrega "📚 Fuentes:" con los artículos citados
- Si aplica, sugiere "Próximos pasos" con acciones concretas
"""

    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.3,
        )

        self.tools = [
            get_fiscal_calendar,
            calculate_iva,
            check_obligation_status,
            get_retention_rate,
            search_sri_legislation,
            get_client_tax_profile,
            simulate_tax_scenario,
            search_tax_documents,
        ]

        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(TaxAgentState)

        workflow.add_node("agent", self._call_agent)
        workflow.add_node("tools", ToolNode(self.tools))

        workflow.set_entry_point("agent")

        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {
                "continue": "tools",
                "end": END,
            },
        )

        workflow.add_edge("tools", "agent")

        return workflow.compile()

    def _call_agent(self, state: TaxAgentState) -> TaxAgentState:
        messages = state["messages"]
        system_message = self._build_system_message(state)
        full_messages = [system_message] + messages
        response = self.llm_with_tools.invoke(full_messages)
        return {"messages": [response]}

    def _build_system_message(self, state: TaxAgentState) -> BaseMessage:
        client_id = state.get("client_id")
        tenant_id = state.get("tenant_id")

        context_section = ""
        if client_id and tenant_id:
            try:
                resp = httpx.get(
                    f"http://tax-service:8000/api/v1/clients/{client_id}/profile",
                    headers={"X-Tenant-Id": tenant_id},
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    profile = resp.json()
                    context_section = f"""

CONTEXTO DEL CLIENTE ACTUAL:
- RUC: {profile.get('ruc')}
- Razón social: {profile.get('razon_social')}
- Régimen: {profile.get('regimen', 'General')}
- Obligado a llevar contabilidad: {profile.get('obligado_contabilidad')}
- Agente de retención: {profile.get('agente_retencion')}
- Contribuyente especial: {profile.get('contribuyente_especial')}
- Próximas obligaciones: {profile.get('upcoming_obligations', 0)} este mes
"""
            except Exception:
                context_section = "\n[Contexto del cliente no disponible]\n"

        return BaseMessage(
            role="system",
            content=self.SYSTEM_PROMPT + context_section,
        )

    def _should_continue(self, state: TaxAgentState) -> str:
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "continue"
        return "end"

    async def invoke(self, query: str, tenant_id: str, client_id: str) -> dict:
        initial_state = {
            "messages": [HumanMessage(content=query)],
            "tenant_id": tenant_id,
            "client_id": client_id,
            "context": {},
        }

        final_state = await self.graph.ainvoke(initial_state)

        messages = final_state["messages"]
        final_message = messages[-1]

        tools_used = []
        for msg in messages:
            if hasattr(msg, "name") and msg.name:
                tools_used.append(msg.name)

        sources = []
        for msg in messages:
            if hasattr(msg, "additional_kwargs") and "sources" in msg.additional_kwargs:
                sources.extend(msg.additional_kwargs["sources"])

        return {
            "answer": final_message.content,
            "sources": sources,
            "tools_used": list(set(tools_used)),
            "confidence": 0.9,
            "message_count": len(messages),
        }


_tax_agent_instance = None


def get_tax_agent():
    global _tax_agent_instance
    if _tax_agent_instance is None:
        _tax_agent_instance = TaxAgent()
    return _tax_agent_instance
