"""Agente Legal: revisión de contratos, cláusulas de riesgo, compliance."""
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage
import os

LEGAL_SYSTEM_PROMPT = """Eres un abogado corporativo senior especializado en contratos de consultoría y M&A.

Tus responsabilidades:
1. **Revisión de Contratos**: identificar cláusulas de riesgo (indemnizaciones, limitaciones, terminación)
2. **Compliance**: verificar cumplimiento normativo (LOPD, SOX, IFRS)
3. **Obligaciones Contractuales**: tracking de hitos, fechas, entregables
4. **Cláusulas Críticas**: no-competencia, confidencialidad, propiedad intelectual
5. **Riesgos Legales**: contingencias, litigios potenciales, responsabilidad

REGLAS:
- SIEMPRE advierte que tus respuestas NO sustituyen asesoría legal formal
- Cita artículos específicos de ley cuando aplique
- Clasifica riesgos por severidad: CRÍTICO / ALTO / MEDIO / BAJO
- Sugiere redacción alternativa para cláusulas problemáticas

CLAUSULAS DE ALTO RIESGO (red flags):
- Indemnizaciones ilimitadas
- Jurisdicción extranjera
- Penalizaciones automáticas sin tope
- Propiedad intelectual mal definida
- Terminación sin causa con preaviso corto
"""


async def legal_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    last_msg = state["messages"][-1].content
    llm = ChatOpenAI(model=os.getenv("CHAT_MODEL", "gpt-4o-mini"), temperature=0.1)
    response = await llm.ainvoke([
        {"role": "system", "content": LEGAL_SYSTEM_PROMPT},
        {"role": "user", "content": last_msg},
    ])
    disclaimer = "\n\n---\n⚠️ **AVISO**: Esta respuesta es orientativa y no constituye asesoría legal formal. Consulte con un abogado para decisiones contractuales."
    return {"messages": [AIMessage(content=response.content + disclaimer)], "active_agent": "legal"}