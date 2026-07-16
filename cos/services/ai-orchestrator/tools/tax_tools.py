"""
Tax Analysis Tools — SRI Compliance Engine for Consulting OS.
Cross-checks annexes, calculates retention impacts, and flags fiscal risks.

Each function is a LangChain Tool callable by the Tax Agent.
"""

from typing import Optional
from langchain_core.tools import tool


@tool
def cross_check_sri_annexes(
    sales_lines: list[dict],
    purchases_lines: list[dict],
) -> dict:
    """Cross-check SRI sales and purchases annexes to detect discrepancies
    that could trigger tax audits (glosas) by the Ecuadorian tax authority.
    
    Args:
        sales_lines: List of sales annexe lines with keys: tipo_comprobante, 
                     fecha_emision, identificacion, base_imponible, iva
        purchases_lines: List of purchases annexe lines with same keys
    """
    discrepancies = []
    total_risk = 0.0

    # 1. Check suppliers that appear in purchases but have no registered sales
    purchase_suppliers = {line.get("identificacion") for line in purchases_lines if line.get("identificacion")}
    sale_customers = {line.get("identificacion") for line in sales_lines if line.get("identificacion")}
    
    unmatched_suppliers = purchase_suppliers - sale_customers
    if unmatched_suppliers:
        discrepancy_amount = sum(
            line.get("base_imponible", 0) for line in purchases_lines
            if line.get("identificacion") in unmatched_suppliers
        )
        discrepancies.append({
            "type": "UNMATCHED_SUPPLIER",
            "description": f"{len(unmatched_suppliers)} suppliers in purchases have no registered sales. "
                          f"This may indicate informal economy transactions or misclassified expenses.",
            "amount": round(discrepancy_amount, 2),
            "severity": "HIGH",
            "recommendation": "Request missing invoices from suppliers. Verify RUC status with SRI.",
        })
        total_risk += discrepancy_amount

    # 2. Check IVA consistency (IVA declared on sales vs IVA claimed on purchases)
    total_sales_iva = sum(line.get("iva", 0) for line in sales_lines)
    total_purchases_iva = sum(line.get("iva", 0) for line in purchases_lines)
    iva_ratio = total_purchases_iva / total_sales_iva if total_sales_iva else 0

    if iva_ratio > 0.9:
        discrepancies.append({
            "type": "HIGH_IVA_CREDIT_RATIO",
            "description": f"IVA credit ratio is {iva_ratio:.1%}. Purchases IVA is {iva_ratio:.1%} of sales IVA. "
                          f"This may trigger an SRI audit for disproportionate credits.",
            "amount": round(total_purchases_iva - total_sales_iva * 0.7, 2),
            "severity": "MODERATE",
            "recommendation": "Review IVA credit composition. Ensure credits correspond to allowed costs.",
        })
        total_risk += total_purchases_iva - total_sales_iva * 0.7

    # 3. Check for missing withholding tax (retenciones)
    purchases_with_retenciones = sum(
        1 for line in purchases_lines
        if line.get("retencion_iva", 0) > 0 or line.get("retencion_renta", 0) > 0
    )
    retencion_ratio = purchases_with_retenciones / len(purchases_lines) if purchases_lines else 1

    if retencion_ratio < 0.3 and len(purchases_lines) > 10:
        discrepancies.append({
            "type": "LOW_RETENTION_RATE",
            "description": f"Only {retencion_ratio:.0%} of purchases have withholding tax applied. "
                          f"Expected minimum 30% for B2B transactions.",
            "amount": 0,
            "severity": "MODERATE",
            "recommendation": "Review if suppliers are applying correct retention percentages per SRI regulations.",
        })

    alert_level = "LOW"
    if total_risk > 50000:
        alert_level = "CRITICAL"
    elif total_risk > 10000:
        alert_level = "HIGH"
    elif total_risk > 1000:
        alert_level = "MODERATE"

    return {
        "total_discrepancies": len(discrepancies),
        "total_risk_amount": round(total_risk, 2),
        "discrepancies": discrepancies,
        "alert_level": alert_level,
        "iva_efficiency_ratio": round(total_sales_iva / total_purchases_iva, 2) if total_purchases_iva else None,
    }


@tool
def calculate_retention_impact(
    total_sales: float,
    retention_rate: float,
    months: int = 12,
    opportunity_cost_rate: float = 0.12,
) -> dict:
    """Calculate the working capital impact of tax retentions (retenciones en la fuente).
    
    In Ecuador, retentions can tie up significant cash flow. This tool quantifies
    the opportunity cost of retained funds.
    
    Args:
        total_sales: Annual total sales in USD
        retention_rate: Average retention rate (e.g., 0.02 for 2%)
        months: Number of months to calculate impact for
        opportunity_cost_rate: Annual opportunity cost of capital (default: 12%)
    """
    monthly_sales = total_sales / 12
    monthly_retained = monthly_sales * retention_rate
    total_retained_annual = monthly_retained * months
    # Average retention recovery lag: ~3 months in Ecuador
    avg_recovery_lag_months = 3
    opportunity_cost = total_retained_annual * opportunity_cost_rate * (avg_recovery_lag_months / 12)

    return {
        "monthly_retained_amount": round(monthly_retained, 2),
        "total_retained_in_period": round(total_retained_annual, 2),
        "annual_opportunity_cost": round(opportunity_cost, 2),
        "avg_recovery_lag_months": avg_recovery_lag_months,
        "recommendation": (
            f"Approximately ${total_retained_annual:,.0f} is tied in retentions annually, "
            f"costing ${opportunity_cost:,.0f} in opportunity cost. "
            f"Consider retention factoring or negotiate reduced rates."
        ),
    }


@tool
def check_fiscal_calendar(
    current_month: int,
    current_day: int,
) -> dict:
    """Check upcoming SRI fiscal obligations and deadlines based on current date.
    Returns alerts for upcoming tax declarations.
    
    Args:
        current_month: Current month (1-12)
        current_day: Current day (1-31)
    """
    obligations = {
        "IVA": {
            "mensual": {"deadline_day": 10, "description": "Declaración de IVA mensual"},
        },
        "RENTA": {
            "anual": {"deadline_month": 4, "deadline_day": 30, "description": "Declaración de Impuesto a la Renta"},
            "anticipos": {"deadline_month": 7, "deadline_day": 15, "description": "Pago de anticipo de Renta"},
        },
        "RETENCIONES": {
            "mensual": {"deadline_day": 10, "description": "Declaración de Retenciones en la Fuente"},
        },
        "ANEXOS": {
            "ats": {"deadline_day": 15, "description": "Anexo Transaccional Simplificado (ATS)"},
            "reoc": {"deadline_month": 3, "deadline_day": 31, "description": "Reporte de Operaciones con el Exterior"},
        },
    }

    alerts = []
    for category, items in obligations.items():
        for subcategory, details in items.items():
            deadline_day = details.get("deadline_day")
            deadline_month = details.get("deadline_month")
            days_until = None

            if deadline_day and not deadline_month:
                # Monthly obligation
                if current_day <= deadline_day:
                    days_until = deadline_day - current_day
                else:
                    continue
            elif deadline_day and deadline_month:
                if current_month == deadline_month:
                    days_until = deadline_day - current_day
                elif current_month < deadline_month:
                    # Calculate days until next month's deadline
                    days_until = 30 + deadline_day - current_day
                else:
                    continue

            if days_until is not None and days_until <= 5 and days_until >= 0:
                severity = "CRITICAL" if days_until <= 2 else "HIGH"
                alerts.append({
                    "type": f"{category}_{subcategory}".upper(),
                    "title": details["description"],
                    "days_until_deadline": days_until,
                    "severity": severity,
                })

    return {
        "upcoming_obligations": alerts,
        "total_alerts": len(alerts),
        "has_critical_alerts": any(a["severity"] == "CRITICAL" for a in alerts),
    }


@tool
def extract_liability_clauses(text: str) -> dict:
    """Extract liability-related clauses from contract text using NLP patterns.
    Identifies cross-guarantees, default penalties, and change-of-control clauses.
    
    Args:
        text: Full text content of a contract or legal document
    """
    import re

    patterns = {
        "cross_guarantee": r"(cross.?guarantee|cross.?collateral|garantía cruzada|prenda cruzada)",
        "default_penalty": r"(default.?interest|penalty.?clause|cláusula.?penal|interés.?moratorio)",
        "change_of_control": r"(change.?of.?control|cambio.?de.?control|accionistas? mayoritari)",
        "acceleration": r"(acceleration.?clause|cláusula.?de.?aceleración|vencimiento.?anticipado)",
        "indemnification": r"(indemnification|indemnizar|mantener.?indemne)",
    }

    findings = []
    for clause_type, pattern in patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            findings.append({
                "clause_type": clause_type,
                "mentions": len(matches),
                "severity": "HIGH" if clause_type in ("cross_guarantee", "acceleration") else "MODERATE",
            })

    return {
        "total_risk_clauses": len(findings),
        "findings": findings,
        "has_cross_guarantees": any(f["clause_type"] == "cross_guarantee" for f in findings),
    }
