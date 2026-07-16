"""
Router Multiagente — Clasifica intención y enruta al agente correcto.
"""
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import Literal, Optional, List
import structlog

logger = structlog.get_logger()


class IntentResult(BaseModel):
    agent: Literal["financial", "tax", "legal", "commercial", "general"]
    confidence: float = Field(ge=0, le=1)
    reasoning: str
    extracted_entities: Optional[dict] = None


class RouterAgent:
    ROUTER_PROMPT = """Eres un router de intenciones para un sistema multi-agente
de consultoría. Clasifica cada pregunta y decide qué agente debe responder.

AGENTES DISPONIBLES:

1. FINANCIAL — Valuación DCF, ratios, EBITDA, flujo de caja, Monte Carlo,
   sinergias M&A, benchmark, proyecciones, WACC, estados financieros, anomalías.
   Ej: "¿Equity value de Acme?", "Analiza liquidez", "Proyecta cash flow 12m"

2. TAX — SRI Ecuador, IVA, retenciones, Impuesto a la Renta, calendario fiscal,
   anexos ATS, RUC, facturación electrónica, RIMPE, anticipos.
   Ej: "¿Cuándo vence el IVA?", "Calcula retenciones", "Genera ATS del mes"

3. LEGAL — Contratos, cláusulas, obligaciones, compliance, Código Civil,
   Código de Comercio, LOPDP, Código del Trabajo, IESS, riesgos legales.
   Ej: "Revisa este contrato", "Obligaciones que vencen", "Fuerza mayor"

4. COMMERCIAL — Pipeline ventas, scoring leads, propuestas, pricing,
   forecast revenue, matching cliente-consultor, CRM, ICP.
   Ej: "¿Cómo va el pipeline?", "Scoring de este lead", "Propuesta para Acme"

5. GENERAL — Preguntas generales, pequeñas charlas. Solo cuando ninguna
   otra categoría aplica claramente.

Si la pregunta es ambigua, prefiere el agente más específico.
Devuelve SOLO el JSON estructurado.
"""

    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini", temperature=0,
        ).with_structured_output(IntentResult)

    async def classify(
        self,
        query: str,
        history: Optional[List[dict]] = None,
        hint: Optional[str] = None,
    ) -> dict:
        if hint and hint in ["financial", "tax", "legal", "commercial"]:
            logger.info("router.using_hint", hint=hint)
            return {
                "agent": hint, "confidence": 1.0,
                "reasoning": f"Forzado por hint: {hint}",
                "extracted_entities": None,
            }

        context = ""
        if history:
            recent = history[-3:]
            context = "\nHistorial reciente:\n" + "\n".join(
                f"- {m['role']}: {m['content'][:100]}" for m in recent
            )

        try:
            result: IntentResult = await self.llm.ainvoke([
                BaseMessage(role="system", content=self.ROUTER_PROMPT + context),
                HumanMessage(content=query),
            ])
            logger.info("router.classified", query=query[:50], agent=result.agent, confidence=result.confidence)
            return {
                "agent": result.agent, "confidence": result.confidence,
                "reasoning": result.reasoning, "extracted_entities": result.extracted_entities,
            }
        except Exception as e:
            logger.error("router.failed", error=str(e))
            return {"agent": "general", "confidence": 0.5, "reasoning": f"Error: {str(e)}", "extracted_entities": None}
