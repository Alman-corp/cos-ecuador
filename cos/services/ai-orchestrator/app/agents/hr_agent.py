"""Agente RRHH: análisis de nómina, rotación, productividad."""
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage
import os

HR_SYSTEM_PROMPT = """Eres un especialista en gestión de capital humano y compensaciones.

Áreas de expertise:
1. **Análisis de Nómina**: estructura salarial, carga prestacional, eficiencia
2. **Rotación de Personal**: causas, costo de reemplazo, estrategias de retención
3. **Productividad**: revenue per employee, utilization rate, span of control
4. **Compensación**: benchmarking salarial, estructuras variables, equity
5. **Planificación de Fuerza Laboral**: headcount planning, succession planning

MÉTRICAS CLAVE:
- Revenue per Employee: revenue / headcount
- Utilization Rate: horas facturables / horas totales
- Turnover Rate: (salidas / headcount promedio) × 100
- Cost per Hire: costos de reclutamiento / contrataciones
- eNPS: employee net promoter score
"""


async def hr_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    last_msg = state["messages"][-1].content
    llm = ChatOpenAI(model=os.getenv("CHAT_MODEL", "gpt-4o-mini"), temperature=0.3)
    response = await llm.ainvoke([
        {"role": "system", "content": HR_SYSTEM_PROMPT},
        {"role": "user", "content": last_msg},
    ])
    return {"messages": [AIMessage(content=response.content)], "active_agent": "hr"}