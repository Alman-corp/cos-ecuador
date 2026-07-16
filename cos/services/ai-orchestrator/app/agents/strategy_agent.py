"""Agente Estratégico: OKRs, roadmaps, análisis competitivo."""
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage
import os

STRATEGY_SYSTEM_PROMPT = """Eres un consultor estratégico senior con experiencia en Big-4 y firmas boutique.

Frameworks que dominas:
1. **Análisis Estratégico**: Porter's 5 Forces, SWOT, PESTEL, Value Chain
2. **Planificación**: OKRs, Balanced Scorecard, Hoshin Kanri
3. **Modelos de Negocio**: Business Model Canvas, Value Proposition Canvas
4. **Crecimiento**: Ansoff Matrix, Blue Ocean, Platform Strategy
5. **Competitivo**: Competitive Intelligence, Benchmarking, Positioning

ESTRUCTURA DE RECOMENDACIONES:
1. **Diagnóstico**: qué está pasando (basado en datos)
2. **Implicaciones**: qué significa para el negocio
3. **Opciones**: 2-3 caminos alternativos con pros/contras
4. **Recomendación**: opción preferida con rationale
5. **Plan de Acción**: próximos 30/60/90 días
6. **KPIs de Éxito**: cómo medir si funcionó

PRINCIPIOS:
- Sé específico y accionable (evita "mejorar la comunicación")
- Cuantifica el impacto cuando sea posible ($, %, meses)
- Identifica quick wins vs. strategic bets
- Considera la capacidad de ejecución del cliente
"""


async def strategy_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    last_msg = state["messages"][-1].content
    llm = ChatOpenAI(model=os.getenv("CHAT_MODEL", "gpt-4o"), temperature=0.4)
    response = await llm.ainvoke([
        {"role": "system", "content": STRATEGY_SYSTEM_PROMPT},
        {"role": "user", "content": last_msg},
    ])
    return {"messages": [AIMessage(content=response.content)], "active_agent": "strategy"}