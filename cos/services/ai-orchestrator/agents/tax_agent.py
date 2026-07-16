"""Tax Agent — LangGraph node.

Specialist: Ex-SRI auditor turned fiscal strategist.
Cross-checks SRI annexes, calculates retention impact, and checks fiscal calendar.
"""

from __future__ import annotations

from models.state import AgentState

from tools.tax_tools import (
    cross_check_sri_annexes,
    calculate_retention_impact,
    check_fiscal_calendar,
)

_TOOL_MAP = {
    "cross_check_sri_annexes": cross_check_sri_annexes.invoke,
    "calculate_retention_impact": calculate_retention_impact.invoke,
    "check_fiscal_calendar": check_fiscal_calendar.invoke,
}


async def run_tax_analysis(state: AgentState) -> dict:
    """Execute tax analysis on document data.

    Looks for SRI XML content, cross-checks annexes, checks fiscal calendar,
    and quantifies retention impact on working capital.
    """
    text = state.document_text
    metadata = state.metadata or {}
    findings = []
    tax_data: dict = {}

    has_xml = "<" in text and ("factura" in text.lower() or "comprobante" in text.lower())

    if has_xml:
        # ── Cross-check SRI annexes ──
        sales = metadata.get("sales_lines", _mock_sales_lines())
        purchases = metadata.get("purchases_lines", _mock_purchases_lines())

        cc = _TOOL_MAP["cross_check_sri_annexes"]({
            "sales_lines": sales,
            "purchases_lines": purchases,
        })
        tax_data["cross_check"] = cc

        for disc in cc.get("discrepancies", []):
            findings.append({
                "agent": "TRIBUTARIO",
                "severity": disc.get("severity", "MEDIUM"),
                "title": disc.get("type", "Discrepancia SRI"),
                "description": disc.get("description", ""),
                "recommendations": [disc.get("recommendation", "Revisar con el área contable")],
            })

    # ── Fiscal calendar (always run) ──
    import datetime
    today = datetime.date.today()
    cal = _TOOL_MAP["check_fiscal_calendar"]({
        "current_month": today.month,
        "current_day": today.day,
    })
    tax_data["calendar"] = cal

    for oblig in cal.get("upcoming_obligations", []):
        if oblig.get("severity") in ("CRITICAL", "HIGH"):
            findings.append({
                "agent": "TRIBUTARIO",
                "severity": oblig["severity"],
                "title": f"Vencimiento: {oblig.get('title', 'Obligación fiscal')}",
                "description": f"Vence en {oblig.get('days_until_deadline', 0)} días.",
                "recommendations": [
                    "Preparar documentación de soporte",
                    "Conciliar retenciones con el SRI",
                    "Verificar que todas las facturas estén contabilizadas",
                ],
            })

    # ── Retention impact (if revenue data available) ──
    parsed = _parse_tax_text(text)
    if parsed.get("total_sales", 0) > 0:
        ri = _TOOL_MAP["calculate_retention_impact"]({
            "total_sales": parsed["total_sales"],
            "retention_rate": 0.02,  # 2% avg retention in Ecuador
            "months": 12,
            "opportunity_cost_rate": 0.12,
        })
        tax_data["retention_impact"] = ri
        findings.append({
            "agent": "TRIBUTARIO",
            "severity": "MEDIUM",
            "title": "Capital Atrapado en Retenciones",
            "description": (
                f"Aproximadamente ${ri.get('total_retained_in_period', 0):,.0f} retenido anualmente, "
                f"con un costo de oportunidad de ${ri.get('annual_opportunity_cost', 0):,.0f}."
            ),
            "recommendations": [
                ri.get("recommendation", "Evaluar factoring de retenciones"),
            ],
        })

    return {
        "tax_analysis": tax_data,
        "findings": findings,
        "overall_risk": _compute_risk(findings),
    }


def _parse_tax_text(text: str) -> dict[str, float]:
    """Extract basic tax-related figures from text."""
    import re

    data: dict[str, float] = {}
    patterns = {
        "total_sales": re.compile(r"(?:total\s+(?:ventas|sales)|ingresos?\s+totales)[^\d]*([\d,.]+)", re.I),
        "total_purchases": re.compile(r"(?:total\s+(?:compras|purchases))[^\d]*([\d,.]+)", re.I),
        "iva_declared": re.compile(r"(?:iva\s+(?:declarado|declared))[^\d]*([\d,.]+)", re.I),
        "retention_iva": re.compile(r"(?:ret(?:ención|ention)\s+iva)[^\d]*([\d,.]+)", re.I),
        "retention_renta": re.compile(r"(?:ret(?:ención|ention)\s+(?:renta|income))[^\d]*([\d,.]+)", re.I),
    }
    for key, pattern in patterns.items():
        match = pattern.search(text)
        if match:
            try:
                data[key] = float(match.group(1).replace(",", ""))
            except ValueError:
                pass
    return data


def _compute_risk(findings: list[dict]) -> str:
    severities = [f["severity"] for f in findings]
    for level in ("CRITICAL", "HIGH", "MEDIUM"):
        if level in severities:
            return level
    return "LOW"


def _mock_sales_lines() -> list[dict]:
    return [
        {"tipo_comprobante": "FACTURA", "fecha_emision": "2026-05-15",
         "identificacion": "1790012345001", "base_imponible": 15000.0, "iva": 1800.0},
        {"tipo_comprobante": "FACTURA", "fecha_emision": "2026-05-20",
         "identificacion": "1790012345001", "base_imponible": 22000.0, "iva": 2640.0},
        {"tipo_comprobante": "FACTURA", "fecha_emision": "2026-06-01",
         "identificacion": "0998765432001", "base_imponible": 8000.0, "iva": 960.0},
    ]


def _mock_purchases_lines() -> list[dict]:
    return [
        {"tipo_comprobante": "FACTURA", "fecha_emision": "2026-05-10",
         "identificacion": "1790012345001", "base_imponible": 12000.0, "iva": 1440.0,
         "retencion_iva": 144.0, "retencion_renta": 120.0},
        {"tipo_comprobante": "FACTURA", "fecha_emision": "2026-05-25",
         "identificacion": "1790012345001", "base_imponible": 18000.0, "iva": 2160.0,
         "retencion_iva": 216.0, "retencion_renta": 180.0},
        {"tipo_comprobante": "FACTURA", "fecha_emision": "2026-06-05",
         "identificacion": "1790012345001", "base_imponible": 5000.0, "iva": 600.0,
         "retencion_iva": 60.0, "retencion_renta": 50.0},
    ]
