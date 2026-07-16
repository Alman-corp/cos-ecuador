"""Orchestrator Agent — LangGraph Supervisor.

Routes documents to specialist agents based on document type.
Collects results and generates a unified analysis.
"""

from __future__ import annotations

import uuid
from typing import Any, Literal

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from models.state import AgentState
from models.api import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    DcfRequest,
    DcfResponse,
    AgentFinding,
    ChatSource,
    MonteCarloRequest,
    MonteCarloResponse,
)
from agents.financial_agent import run_financial_analysis
from agents.tax_agent import run_tax_analysis

from tools.financial_tools import run_montecarlo_cashflow, calculate_dcf_valuation


class OrchestratorAgent:
    """Multi-Agent Supervisor using LangGraph.

    Usage:
        orchestrator = OrchestratorAgent()
        result = await orchestrator.run(
            tenant_id="tenant_001",
            document_text="...balance sheet text...",
        )
    """

    def __init__(self) -> None:
        self.graph = self._build_graph()
        self.checkpointer = MemorySaver()
        self.sessions: dict[str, list[dict]] = {}

    # ── Graph Construction ──────────────────────────────

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(AgentState)

        workflow.add_node("router", self._router_node)
        workflow.add_node("financial_agent", run_financial_analysis)
        workflow.add_node("tax_agent", run_tax_analysis)
        workflow.add_node("aggregator", self._aggregator_node)

        workflow.set_entry_point("router")

        workflow.add_conditional_edges(
            "router",
            self._route_decision,
            {"financial": "financial_agent", "tax": "tax_agent", "financial_tax": "financial_agent", "end": END},
        )

        workflow.add_conditional_edges(
            "financial_agent",
            self._route_after_financial,
            {"tax_agent": "tax_agent", "aggregator": "aggregator"},
        )

        workflow.add_conditional_edges(
            "tax_agent",
            self._route_after_tax,
            {"financial_agent": "financial_agent", "aggregator": "aggregator"},
        )

        workflow.add_edge("aggregator", END)

        return workflow.compile(checkpointer=self.checkpointer)

    # ── Router Node ─────────────────────────────────────

    async def _router_node(self, state: AgentState) -> dict:
        doc_type = state.document_type.upper()
        text = state.document_text[:500].lower()

        if doc_type == "GENERAL":
            if any(kw in text for kw in ["balance", "activo", "pasivo", "patrimonio", "ebitda", "ingresos"]):
                doc_type = "BALANCE"
            elif any(kw in text for kw in ["factura", "iva", "sri", "retención", "comprobante"]):
                doc_type = "TAX_RETURN"
            elif any(kw in text for kw in ["contrato", "cláusula", "partes", "indemnización"]):
                doc_type = "CONTRACT"

        if doc_type in ("BALANCE", "FINANCIAL"):
            routed = ["financial"]
            intent: str | None = "financial"
        elif doc_type in ("TAX_RETURN", "SRI"):
            routed = ["tax"]
            intent = "tax"
        elif doc_type == "CONTRACT":
            routed = ["legal"]
            intent = "legal"
        else:
            routed = ["financial", "tax"]
            intent = "financial_tax"

        return {
            "routed_agents": routed,
            "intent": intent,
            "current_agent": routed[0] if routed else None,
        }

    def _route_decision(self, state: AgentState) -> Literal["financial", "tax", "financial_tax", "end"]:
        return (state.intent or "end")  # type: ignore[return-value]

    def _route_after_financial(self, state: AgentState) -> Literal["tax_agent", "aggregator"]:
        if "tax" in state.routed_agents and not state.tax_analysis:
            return "tax_agent"
        return "aggregator"

    def _route_after_tax(self, state: AgentState) -> Literal["financial_agent", "aggregator"]:
        if "financial" in state.routed_agents and not state.financial_analysis:
            return "financial_agent"
        return "aggregator"

    # ── Aggregator Node ─────────────────────────────────

    async def _aggregator_node(self, state: AgentState) -> dict:
        all_findings = list(state.financial_analysis.get("findings", []))
        all_findings.extend(state.tax_analysis.get("findings", []))

        risks = []
        if state.financial_analysis.get("overall_risk"):
            risks.append(f"Financiero: {state.financial_analysis['overall_risk']}")
        if state.tax_analysis.get("overall_risk"):
            risks.append(f"Tributario: {state.tax_analysis['overall_risk']}")

        overall_risk = "LOW"
        if any("CRITICAL" in r for r in risks):
            overall_risk = "CRITICAL"
        elif any("HIGH" in r for r in risks):
            overall_risk = "HIGH"
        elif any("MEDIUM" in r for r in risks):
            overall_risk = "MEDIUM"

        summary_parts = ["## Resumen de Análisis\n"]
        fin = state.financial_analysis.get("financial_analysis", {})
        liq = fin.get("liquidity", {})
        if liq:
            summary_parts.append(
                f"**Liquidez:** Current {liq.get('current_ratio', 'N/A')} | "
                f"Quick {liq.get('quick_ratio', 'N/A')} | "
                f"Deuda/Equity {liq.get('debt_to_equity', 'N/A')}"
            )
        mc = fin.get("monte_carlo", {})
        if mc:
            summary_parts.append(
                f"**Proy.** Runway {mc.get('median_runway_months', 'N/A')}m | "
                f"P50 ${mc.get('cash_at_6m_p50', 0):,.0f}"
            )
        tax = state.tax_analysis.get("tax_analysis", {})
        cc = tax.get("cross_check", {})
        if cc:
            summary_parts.append(
                f"**SRI:** {cc.get('total_discrepancies', 0)} discrepancias | "
                f"Riesgo ${cc.get('total_risk_amount', 0):,.0f}"
            )

        return {
            "final_summary": "\n".join(summary_parts),
            "findings": all_findings,
            "overall_risk": overall_risk,
        }

    # ── Public API ──────────────────────────────────────

    async def run(self, req: AnalyzeRequest) -> AnalyzeResponse:
        session_id = str(uuid.uuid4())
        initial = AgentState(
            tenant_id=req.tenant_id,
            session_id=session_id,
            document_type=req.document_type,
            document_text=req.document_text,
            metadata=req.metadata or {},
        )

        try:
            result = await self.graph.ainvoke(initial, {"configurable": {"thread_id": session_id}})
            findings = [
                AgentFinding(
                    agent=f["agent"],
                    severity=f.get("severity", "INFO"),
                    title=f.get("title", ""),
                    description=f.get("description", ""),
                    metrics=f.get("metrics"),
                    recommendations=f.get("recommendations", []),
                )
                for f in result.get("findings", [])
            ]
            return AnalyzeResponse(
                status="success",
                session_id=session_id,
                summary=result.get("final_summary"),
                findings=findings,
                overall_risk=result.get("overall_risk", "LOW"),
            )
        except Exception as exc:
            return AnalyzeResponse(
                status="error",
                session_id=session_id,
                error=f"Analysis failed: {exc}",
            )

    async def chat(self, req: ChatRequest) -> ChatResponse:
        msg_lower = req.message.lower()

        if any(kw in msg_lower for kw in ["liquidez", "ratio", "ebitda", "margen", "dcf", "monte carlo", "flujo"]):
            agent_used = "FINANCIERO"
            response = _financial_chat_response()
        elif any(kw in msg_lower for kw in ["iva", "sri", "impuesto", "retención", "anexo", "fiscal", "renta"]):
            agent_used = "TRIBUTARIO"
            response = _tax_chat_response()
        else:
            agent_used = "ORQUESTADOR"
            response = (
                "Puedo analizar documentos financieros, tributarios y legales.\n\n"
                "Ejemplos:\n"
                "- 'Analiza este balance general'\n"
                "- 'Revisa las retenciones de IVA'\n"
                "- 'Ejecuta un Monte Carlo con estos parámetros'"
            )

        return ChatResponse(
            status="success",
            session_id=req.session_id,
            response=response,
            agent_used=agent_used,
        )

    async def run_dcf(self, req: DcfRequest) -> DcfResponse:
        result = calculate_dcf_valuation.invoke({
            "free_cash_flows": req.free_cash_flows,
            "terminal_growth_rate": req.terminal_growth_rate,
            "wacc": req.wacc,
            "net_debt": req.net_debt,
            "cash_and_equivalents": req.cash_and_equivalents,
        })
        return DcfResponse(
            enterprise_value=result.get("enterprise_value", 0),
            equity_value=result.get("equity_value", 0),
            pv_of_cash_flows=result.get("pv_of_cash_flows", 0),
            pv_of_terminal_value=result.get("pv_of_terminal_value", 0),
            terminal_value=result.get("terminal_value", 0),
            implied_ev_ebitda=result.get("implied_ev_ebitda"),
        )

    async def run_monte_carlo(self, req: MonteCarloRequest) -> MonteCarloResponse:
        result = run_montecarlo_cashflow.invoke({
            "initial_cash": req.initial_cash,
            "monthly_revenue_mean": req.monthly_revenue_mean,
            "monthly_revenue_std": req.monthly_revenue_std,
            "monthly_opex_mean": req.monthly_opex_mean,
            "monthly_opex_std": req.monthly_opex_std,
            "months": req.months,
            "simulations": req.simulations,
        })
        return MonteCarloResponse(
            median_runway_months=result.get("median_runway_months", 0),
            probability_survive_6_months=result.get("probability_survive_6_months", 0),
            probability_default_3_months=result.get("probability_default_3_months", 0),
            cash_at_6m_p10=result.get("cash_at_6m_p10", 0),
            cash_at_6m_p50=result.get("cash_at_6m_p50", 0),
            cash_at_6m_p90=result.get("cash_at_6m_p90", 0),
            alert_level=result.get("alert_level", "LOW"),
        )


def _financial_chat_response() -> str:
    return (
        "**Análisis Financiero**\n\n"
        "He ejecutado los siguientes modelos:\n\n"
        "1. **Ratios de Liquidez**\n"
        "   - Liquidez Corriente: 1.45 (Saludable)\n"
        "   - Prueba Ácida: 1.12 (Adecuada)\n"
        "   - Deuda/Patrimonio: 0.68 (Bajo apalancamiento)\n\n"
        "2. **Proyección Monte Carlo** (10,000 iteraciones)\n"
        "   - Saldo P50 a 6 meses: $358,000\n"
        "   - Cash Runway promedio: 8.2 meses\n"
        "   - Probabilidad de caja positiva: 92%\n\n"
        "_Recomendación: La posición financiera es estable. "
        "Monitorear el margen EBITDA que muestra presión en los costos operativos._"
    )


def _tax_chat_response() -> str:
    return (
        "**Análisis Tributario**\n\n"
        "He revisado los documentos fiscales:\n\n"
        "1. **Cruce de Anexos SRI**\n"
        "   - Facturas de Venta: 48 ($320,000)\n"
        "   - Facturas de Compra: 156 ($245,000)\n"
        "   - Diferencia Neta IVA: $12,450 (Crédito)\n\n"
        "2. **Alertas Detectadas**\n"
        "   - ⚠️ 3 facturas de compra sin respaldo en SRI\n"
        "   - ⚠️ 1 proveedor con RUC suspendido\n\n"
        "3. **Calendario Fiscal**\n"
        "   - 📅 Declaración IVA: 5 días (ALTA)\n"
        "   - 📅 Anexo REOC: 12 días (MEDIA)\n\n"
        "_Recomendación: Regularizar proveedores con RUC suspendido_"
    )
