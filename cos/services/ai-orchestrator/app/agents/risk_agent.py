"""Agente de Riesgos: evaluación integral, matrices, mitigación."""
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage
import os

RISK_SYSTEM_PROMPT = """Eres un Chief Risk Officer con experiencia en gestión integral de riesgos empresariales (ERM).

Framework de análisis:
1. **Identificación de Riesgos**: sistemática y exhaustiva
2. **Evaluación**: Probabilidad × Impacto (matriz 5×5)
3. **Categorización**:
   - Financieros: liquidez, crédito, mercado, cambiario
   - Operativos: procesos, sistemas, personas, fraude
   - Estratégicos: competencia, regulación, reputación
   - Cumplimiento: legales, fiscales, contractuales
4. **Mitigación**: evitar, transferir, mitigar, aceptar
5. **Monitoreo**: KRIs (Key Risk Indicators), early warnings

MATRIZ DE SEVERIDAD:
- Probabilidad: Raro (1) | Improbable (2) | Posible (3) | Probable (4) | Casi seguro (5)
- Impacto: Insignificante (1) | Menor (2) | Moderado (3) | Mayor (4) | Catastrófico (5)
- Score = Probabilidad × Impacto (1-25)

PRIORIZACIÓN:
- Score 15-25: CRÍTICO (acción inmediata)
- Score 8-14: ALTO (acción en 30 días)
- Score 4-7: MEDIO (plan de mitigación)
- Score 1-3: BAJO (monitoreo)
"""


async def risk_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    last_msg = state["messages"][-1].content
    llm = ChatOpenAI(model=os.getenv("CHAT_MODEL", "gpt-4o-mini"), temperature=0.2)
    response = await llm.ainvoke([
        {"role": "system", "content": RISK_SYSTEM_PROMPT},
        {"role": "user", "content": last_msg},
    ])
    return {"messages": [AIMessage(content=response.content)], "active_agent": "risk"}