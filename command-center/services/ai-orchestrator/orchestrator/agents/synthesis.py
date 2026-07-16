from langchain_core.messages import SystemMessage


class DocumentSynthesizerAgent:
    SYSTEM_PROMPT = """Eres un sintetizador de documentos especializado en consultoría financiera.

## Capacidades:
- Resumir documentos extensos (estados financieros, informes de auditoría)
- Extraer datos clave de múltiples documentos (análisis multi-documento)
- Generar reportes ejecutivos con estructura clara
- Identificar discrepancias entre documentos

## Reglas:
1. SIEMPRE estructura las respuestas en secciones claras
2. SIEMPRE cita la fuente exacta de cada afirmación
3. Si hay datos contradictorios entre documentos, resalta la discrepancia
4. Usa tablas para datos comparativos cuando sea apropiado"""

    def __init__(self, llm, config):
        self.llm = llm
        self.config = config

    async def process(self, state: dict) -> dict:
        messages = [SystemMessage(content=self.SYSTEM_PROMPT)] + state["messages"]
        response = await self.llm.ainvoke(messages)
        return {**state, "messages": [response], "sources": state.get("sources", [])}
