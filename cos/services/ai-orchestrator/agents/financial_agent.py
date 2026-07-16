"""Financial Agent — LangGraph node.

Specialist: Quantitative Economist.
Runs liquidity, profitability, Monte Carlo, and DCF analysis.
"""

from __future__ import annotations

from models.state import AgentState

# Import tools from the existing LangChain tool registry
from tools.financial_tools import (
    calculate_liquidity_ratios,
    calculate_profitability_ratios,
    calculate_leverage_ratios,
    run_montecarlo_cashflow,
    calculate_dcf_valuation,
    calculate_working_capital,
)

# Map tool names to callables so we can invoke them without LLM
_TOOL_MAP = {
    "calculate_liquidity_ratios": calculate_liquidity_ratios.invoke,
    "calculate_profitability_ratios": calculate_profitability_ratios.invoke,
    "calculate_leverage_ratios": calculate_leverage_ratios.invoke,
    "run_montecarlo_cashflow": run_montecarlo_cashflow.invoke,
    "calculate_dcf_valuation": calculate_dcf_valuation.invoke,
    "calculate_working_capital": calculate_working_capital.invoke,
}


async def run_financial_analysis(state: AgentState) -> dict:
    """Execute financial analysis on the document data.

    Invokes LangChain tools directly (no LLM call in the MVP).
    Returns a dict that merges into AgentState.
    """
    text = state.document_text
    metadata = state.metadata or {}
    findings = []
    financial_data: dict = {}

    # ── Step 1: Parse balance sheet from text ──
    parsed = _parse_balance_sheet(text)

    if parsed:
        financial_data["parsed"] = parsed

        # ── Liquidity Ratios ──
        liq = _TOOL_MAP["calculate_liquidity_ratios"]({
            "current_assets": parsed.get("current_assets", 0),
            "current_liabilities": parsed.get("current_liabilities", 1),
            "inventory": parsed.get("inventory", 0),
            "cash_and_equivalents": parsed.get("cash_and_equivalents", 0),
            "accounts_receivable": parsed.get("accounts_receivable", 0),
        })
        financial_data["liquidity"] = liq
        for alert in liq.get("alerts", []):
            findings.append({
                "agent": "FINANCIERO",
                "severity": alert.get("severity", "HIGH"),
                "title": alert.get("title", "Ratio fuera de umbral"),
                "description": str(alert),
                "recommendations": ["Revisar estructura de capital de trabajo"],
            })

        # ── Profitability Ratios ──
        prof = _TOOL_MAP["calculate_profitability_ratios"]({
            "revenue": parsed.get("revenue", 0),
            "cogs": parsed.get("cogs", 0),
            "opex": parsed.get("opex", 0),
            "total_assets": parsed.get("total_assets", 1),
            "equity": parsed.get("equity", 1),
            "net_income": parsed.get("net_income", 0),
        })
        financial_data["profitability"] = prof
        if prof.get("net_margin_pct", 0) < 5:
            findings.append({
                "agent": "FINANCIERO",
                "severity": "HIGH",
                "title": "Margen Neto Crítico",
                "description": f"Margen neto de {prof['net_margin_pct']}%. Por debajo del 5% mínimo saludable.",
                "recommendations": [
                    "Revisar estructura de costos operativos",
                    "Analizar política de precios vs competencia",
                ],
            })

        # ── Leverage Ratios ──
        lev = _TOOL_MAP["calculate_leverage_ratios"]({
            "total_liabilities": parsed.get("total_liabilities", 0),
            "equity": parsed.get("equity", 1),
            "ebitda": parsed.get("ebitda", 0),
            "interest_expense": parsed.get("interest_expense", 1),
            "short_term_debt": parsed.get("short_term_debt", 0),
            "long_term_debt": parsed.get("long_term_debt", 0),
        })
        financial_data["leverage"] = lev
        for alert in lev.get("alerts", []):
            findings.append({
                "agent": "FINANCIERO",
                "severity": alert.get("severity", "HIGH"),
                "title": alert.get("title", "Alerta de Apalancamiento"),
                "description": str(alert),
                "recommendations": ["Revisar estructura de deuda"],
            })

    # ── Step 2: Monte Carlo (if params provided in metadata) ──
    mc_params = metadata.get("monte_carlo")
    if mc_params:
        mc = _TOOL_MAP["run_montecarlo_cashflow"]({
            "initial_cash": mc_params.get("initial_cash", 500_000),
            "monthly_revenue_mean": mc_params.get("monthly_revenue_mean", 200_000),
            "monthly_revenue_std": mc_params.get("monthly_revenue_std", 40_000),
            "monthly_opex_mean": mc_params.get("monthly_opex_mean", 150_000),
            "monthly_opex_std": mc_params.get("monthly_opex_std", 20_000),
            "months": mc_params.get("months", 6),
            "simulations": mc_params.get("simulations", 10_000),
        })
        financial_data["monte_carlo"] = mc
        findings.append({
            "agent": "FINANCIERO",
            "severity": mc.get("alert_level", "LOW"),
            "title": f"Monte Carlo: {mc.get('alert_level', 'LOW')}",
            "description": (
                f"Runway medio: {mc.get('median_runway_months', 'N/A')} meses. "
                f"Prob. default 3m: {(mc.get('probability_default_3_months', 0) * 100):.0f}%. "
                f"Saldo P50 M6: ${mc.get('cash_at_6m_p50', 0):,.0f}"
            ),
            "metrics": {
                "median_runway": mc.get("median_runway_months"),
                "prob_default_3m": mc.get("probability_default_3_months"),
                "prob_survive_6m": mc.get("probability_survive_6_months"),
            },
            "recommendations": _runway_recommendations(
                mc.get("median_runway_months", 12)
            ),
        })

    return {
        "financial_analysis": financial_data,
        "findings": findings,
        "overall_risk": _compute_risk(findings),
    }


def _parse_balance_sheet(text: str) -> dict[str, float]:
    """Naive keyword-based parser for balance sheet / P&L text.

    In production, replace with LLM extraction or NLP.
    """
    import re

    patterns: dict[str, re.Pattern] = {
        "current_assets": re.compile(r"(?:activo\s+corriente|current\s+assets)[^\d]*([\d,.]+)", re.I),
        "total_assets": re.compile(r"(?:activo\s+total|total\s+assets)[^\d]*([\d,.]+)", re.I),
        "current_liabilities": re.compile(r"(?:pasivo\s+corriente|current\s+liabilities)[^\d]*([\d,.]+)", re.I),
        "total_liabilities": re.compile(r"(?:pasivo\s+total|total\s+liabilities)[^\d]*([\d,.]+)", re.I),
        "equity": re.compile(r"(?:patrimonio|equity|capital)[^\d]*([\d,.]+)", re.I),
        "revenue": re.compile(r"(?:ingresos|revenue|ventas)[^\d]*([\d,.]+)", re.I),
        "cogs": re.compile(r"(?:costo\s+de\s+ventas|cogs)[^\d]*([\d,.]+)", re.I),
        "opex": re.compile(r"(?:gastos?\s+operativos|opex|operating\s+expenses)[^\d]*([\d,.]+)", re.I),
        "net_income": re.compile(r"(?:utilidad\s+neta|net\s+income)[^\d]*([\d,.]+)", re.I),
        "ebitda": re.compile(r"ebitda[^\d]*([\d,.]+)", re.I),
        "interest_expense": re.compile(r"(?:intereses?|interest\s+expense)[^\d]*([\d,.]+)", re.I),
        "inventory": re.compile(r"(?:inventario|inventory)[^\d]*([\d,.]+)", re.I),
        "accounts_receivable": re.compile(r"(?:cuentas?\s+por\s+cobrar|accounts?\s+receivable)[^\d]*([\d,.]+)", re.I),
        "cash_and_equivalents": re.compile(r"(?:efectivo|cash)[^\d]*([\d,.]+)", re.I),
        "short_term_debt": re.compile(r"(?:deuda\s+corto\s+plazo|short.?term\s+debt)[^\d]*([\d,.]+)", re.I),
        "long_term_debt": re.compile(r"(?:deuda\s+largo\s+plazo|long.?term\s+debt)[^\d]*([\d,.]+)", re.I),
    }

    result: dict[str, float] = {}
    for key, pattern in patterns.items():
        match = pattern.search(text)
        if match:
            raw = match.group(1).replace(",", "")
            try:
                result[key] = float(raw)
            except ValueError:
                pass
    return result


def _compute_risk(findings: list[dict]) -> str:
    severities = [f["severity"] for f in findings]
    for level in ("CRITICAL", "HIGH", "MEDIUM"):
        if level in severities:
            return level
    return "LOW"


def _runway_recommendations(months: float) -> list[str]:
    if months < 3:
        return [
            "Negociar líneas de crédito de emergencia",
            "Reducir gastos no críticos 30%+ inmediatamente",
            "Convertir deuda corta a larga",
            "Congelar contrataciones y CAPEX",
        ]
    if months < 6:
        return [
            "Monitoreo semanal de flujo de caja",
            "Optimizar capital de trabajo (DSO, DPO, DIO)",
            "Revisar política de dividendos",
            "Establecer línea de crédito contingente",
        ]
    return [
        "Mantener monitoreo mensual",
        "Evaluar inversiones del excedente de caja",
        "Revisar estructura de capital óptima",
    ]
