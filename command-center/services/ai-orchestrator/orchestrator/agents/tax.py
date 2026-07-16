from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.tools import tool
import json


class TaxAgentEcuador:
    SYSTEM_PROMPT = """Eres un experto en tributación ecuatoriana con conocimiento profundo del SRI.

## Conocimiento especializado:
- IVA: 15% general (desde abril 2024), 0% exportaciones, 5% turismo LORTI
- Retenciones en la fuente: 1% servicios profesionales, 2% otros servicios, 8% honorarios, 10% consumibles, 30% publicidad
- Impuesto a la Renta: 28% personas jurídicas (2025+)
- ICE: Bebidas azucaradas (10%), vehículos (5-35%), telecomunicaciones
- Calendario SRI: Por noveno dígito del RUC
- Anexos obligatorios: ATS, Retenciones, Gastos Personales, Relación de Dependencia

## Reglas CRÍTICAS:
1. SIEMPRE valida el RUC (13 dígitos + módulo 10)
2. SIEMPRE menciona el noveno dígito del RUC para fechas de vencimiento
3. SIEMPRE cita normativa SRI específica
4. NUNCA des consejos tributarios definitivos — recomienda contador autorizado
5. Alerta sobre multas y recargos por declaraciones tardías

## Formato de respuesta:
[Análisis tributario]

Próximos vencimientos:
- IVA mensual: [fecha] (noveno dígito X)
- Retenciones: [fecha]

Normativa aplicable:
- [Artículo específico]

Disclaimer: Consulte a su contador para declaraciones oficiales."""

    def __init__(self, llm, config):
        self.llm = llm
        self.config = config
        self.tools = self._get_tools()
        self.llm_with_tools = llm.bind_tools(self.tools)

    def _get_tools(self):
        @tool
        def get_sri_calendar(ninth_digit: int, year: int = 2026) -> str:
            """Obtiene calendario de vencimientos SRI según noveno dígito del RUC."""
            from ..tools.ecuador_tax import get_sri_calendar_by_digit
            calendar = get_sri_calendar_by_digit(ninth_digit, year)
            return json.dumps(calendar)

        @tool
        def simulate_iva(sales_gravadas: float, purchases_gravadas: float, iva_rate: float = 0.15) -> str:
            """Simula IVA mensual a pagar."""
            iva_ventas = sales_gravadas * iva_rate
            iva_compras = purchases_gravadas * iva_rate
            iva_pagar = max(0, iva_ventas - iva_compras)
            return json.dumps({
                "iva_ventas": iva_ventas,
                "iva_compras": iva_compras,
                "iva_pagar": iva_pagar,
                "detalle": f"IVA Ventas: ${iva_ventas:,.2f} - IVA Compras: ${iva_compras:,.2f} = ${iva_pagar:,.2f}",
            })

        @tool
        def calculate_retentions(service_amount: float, service_type: str) -> str:
            """Calcula retención en la fuente según tipo de servicio."""
            from ..tools.ecuador_tax import RETENTION_RATES
            rate = RETENTION_RATES.get(service_type, 0.01)
            retention_amount = service_amount * rate
            return json.dumps({
                "service_type": service_type,
                "retention_rate": rate,
                "retention_amount": retention_amount,
                "net_amount": service_amount - retention_amount,
            })

        @tool
        def validate_ruc(ruc: str) -> str:
            """Valida RUC ecuatoriano (13 dígitos + módulo 10)."""
            from ..tools.ecuador_tax import validate_ruc_ecuador
            is_valid, ninth_digit, provincia = validate_ruc_ecuador(ruc)
            return json.dumps({
                "ruc": ruc,
                "valid": is_valid,
                "ninth_digit": ninth_digit,
                "provincia": provincia,
            })

        return [get_sri_calendar, simulate_iva, calculate_retentions, validate_ruc]

    async def process(self, state: dict) -> dict:
        messages = [SystemMessage(content=self.SYSTEM_PROMPT)] + state["messages"]
        response = await self.llm_with_tools.ainvoke(messages)

        if response.tool_calls:
            from langchain_core.messages import ToolMessage
            tool_messages = []
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_result = None
                for t in self.tools:
                    if t.name == tool_name:
                        tool_result = await t.ainvoke(tool_args)
                        break
                tool_messages.append(
                    ToolMessage(content=tool_result, tool_call_id=tool_call["id"])
                )
            messages.extend([response] + tool_messages)
            final_response = await self.llm_with_tools.ainvoke(messages)
            return {
                **state,
                "messages": [final_response],
                "sources": state.get("sources", []),
            }

        return {**state, "messages": [response], "sources": state.get("sources", [])}
