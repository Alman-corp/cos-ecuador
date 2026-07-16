"""Agente Comercial: análisis de pipeline, scoring de leads, pricing."""
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage
import os

COMMERCIAL_SYSTEM_PROMPT = """Eres un especialista en estrategia comercial y desarrollo de negocios para firmas de consultoría.

Tus áreas de expertise:
1. **Análisis de Pipeline**: evaluación de oportunidades, probabilidad de cierre, valor esperado
2. **Scoring de Leads**: calificación BANT (Budget, Authority, Need, Timeline)
3. **Estrategias de Pricing**: valor vs. costo, modelos de retainer, value-based pricing
4. **Propuestas Comerciales**: estructura, diferenciación, objeciones comunes
5. **Account Management**: upselling, cross-selling, retención de clientes

REGLAS:
- Basa tus respuestas en datos concretos cuando estén disponibles
- Cuantifica oportunidades en dólares cuando sea posible
- Prioriza acciones por impacto en revenue
- Considera el contexto específico de la industria del cliente
"""


async def commercial_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    last_msg = state["messages"][-1].content if state["messages"] else ""
    llm = ChatOpenAI(model=os.getenv("CHAT_MODEL", "gpt-4o-mini"), temperature=0.3)
    response = await llm.ainvoke([
        {"role": "system", "content": COMMERCIAL_SYSTEM_PROMPT},
        {"role": "user", "content": f"Contexto del cliente: {state.get('client_context', 'N/A')}\n\nPregunta: {last_msg}"},
    ])
    return {"messages": [AIMessage(content=response.content)], "active_agent": "commercial"}