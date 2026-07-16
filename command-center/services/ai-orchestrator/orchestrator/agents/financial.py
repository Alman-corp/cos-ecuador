from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.tools import tool
from typing import List
from decimal import Decimal
import json


class FinancialAnalystAgent:
    SYSTEM_PROMPT = """Eres un analista financiero senior especializado en consultoría para empresas ecuatorianas.

## Tu conocimiento incluye:
- Valuación de empresas (DCF, múltiplos de mercado, synergies M&A)
- Análisis de estados financieros (ratios de liquidez, solvencia, rentabilidad)
- Proyecciones financieras y escenarios de estrés
- Estructura de capital óptima (WACC, deuda/equity)
- Normativa ecuatoriana: Impuesto a la Renta 28%, IVA 15%, participaciones trabajadores 15%

## Reglas CRÍTICAS:
1. SIEMPRE cita fuentes con trazabilidad ISD (archivo + página + chunk)
2. NUNCA des consejos de inversión definitivos — siempre recomienda consultar profesional
3. SIEMPRE muestra supuestos explícitos (WACC, growth rate, terminal value)
4. Usa SIEMPRE Decimal para cálculos de dinero (no float)
5. Formato de moneda: USD con formato ecuatoriano (1.234,56)
6. Si no tienes datos suficientes, DILO claramente y pide más información

## Formato de respuesta:
[Análisis estructurado]

Fuentes:
- [Archivo] página X, chunk Y (confianza Z%)

Disclaimer: Este análisis es informativo. Consulte a un profesional para decisiones de inversión."""

    def __init__(self, llm, config):
        self.llm = llm
        self.config = config
        self.tools = self._get_tools()
        self.llm_with_tools = llm.bind_tools(self.tools)

    def _get_tools(self):
        @tool
        def calculate_dcf(
            historical_fcf: List[float],
            growth_rate: float,
            wacc: float,
            terminal_growth: float,
            debt: float,
            cash: float,
        ) -> str:
            """Calcula valuación DCF completa."""
            from ..tools.financial_tools import run_dcf
            result = run_dcf(
                historical_fcf=[Decimal(str(x)) for x in historical_fcf],
                growth_rate=Decimal(str(growth_rate)),
                wacc=Decimal(str(wacc)),
                terminal_growth=Decimal(str(terminal_growth)),
                debt=Decimal(str(debt)),
                cash=Decimal(str(cash)),
            )
            return json.dumps({
                "enterprise_value": float(result.enterprise_value),
                "equity_value": float(result.equity_value),
                "fcf_projections": [float(x) for x in result.fcf_projections],
                "terminal_value": float(result.terminal_value),
                "assumptions": result.assumptions,
            })

        @tool
        def run_monte_carlo(
            base_fcf: float,
            growth_mean: float,
            growth_std: float,
            wacc_mean: float,
            wacc_std: float,
            iterations: int = 10000,
        ) -> str:
            """Ejecuta simulación Monte Carlo para valuación."""
            from ..tools.financial_tools import run_montecarlo_valuation
            result = run_montecarlo_valuation(
                base_fcf=base_fcf,
                growth_mean=growth_mean,
                growth_std=growth_std,
                wacc_mean=wacc_mean,
                wacc_std=wacc_std,
                iterations=iterations,
            )
            return json.dumps({
                "iterations": result.iterations,
                "mean": float(result.mean),
                "percentiles": {
                    "p5": float(result.percentiles["p5"]),
                    "p25": float(result.percentiles["p25"]),
                    "p50": float(result.percentiles["p50"]),
                    "p75": float(result.percentiles["p75"]),
                    "p95": float(result.percentiles["p95"]),
                },
            })

        @tool
        def calculate_ratios(financial_data: dict) -> str:
            """Calcula ratios financieros de estados contables."""
            from ..tools.financial_tools import calculate_financial_ratios
            ratios = calculate_financial_ratios(financial_data)
            return json.dumps(ratios)

        return [calculate_dcf, run_monte_carlo, calculate_ratios]

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
