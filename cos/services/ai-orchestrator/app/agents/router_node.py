"""Router node for LangGraph — classifies intent to the correct specialist agent."""
from typing import Dict, Any, Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage
import os
from typing import Dict, Any, Literal


ROUTER_PROMPT = """Clasifica la intención del usuario en EXACTAMENTE una de estas categorías:

- "financial": análisis financiero, ratios, márgenes, estados contables
- "tax": impuestos, declaraciones, SRI, SAT, DIAN, planificación fiscal
- "commercial": ventas, pipeline, pricing, propuestas, clientes
- "legal": contratos, cláusulas, compliance, aspectos legales
- "hr": recursos humanos, nómina, rotación, productividad, equipo
- "risk": riesgos, amenazas, contingencias, mitigación
- "strategy": estrategia, planificación, OKRs, crecimiento, competitivo
- "general": otras preguntas

Pregunta: {question}

Responde SOLO con la categoría (una palabra)."""


async def router_node(state: Dict[str, Any]) -> Dict[str, Any]:
    last_msg = state["messages"][-1].content if state["messages"] else ""
    llm = ChatOpenAI(model=os.getenv("CHAT_MODEL", "gpt-4o-mini"), temperature=0.1)
    response = await llm.ainvoke([
        {"role": "system", "content": ROUTER_PROMPT.replace("{question}", last_msg)},
    ])
    intent = response.content.strip().lower()
    valid_intents = {"financial", "tax", "commercial", "legal", "hr", "risk", "strategy", "general"}
    if intent not in valid_intents:
        intent = "general"
    return {"active_agent": intent, "intent": intent}