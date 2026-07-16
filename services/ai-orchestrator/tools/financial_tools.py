"""
Tools del Agente Financiero — Motor M9 completo.
"""
from langchain_core.tools import tool
import httpx
from typing import Optional, List

FINANCE_SERVICE_URL = "http://finance-service:8000/api/v1"


@tool
def get_financial_ratios(client_id: str, tenant_id: str, period: str = "latest") -> dict:
    """
    Calcula ratios financieros completos de un cliente.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        period: Período a analizar ("latest", "2024", "2024-Q4", "yoy")

    Returns:
        Diccionario con ratios agrupados: liquidez, solvencia, rentabilidad, eficiencia, mercado
    """
    try:
        resp = httpx.get(
            f"{FINANCE_SERVICE_URL}/ratios/{client_id}",
            params={"period": period},
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error obteniendo ratios: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def run_dcf_valuation(
    client_id: str,
    tenant_id: str,
    projection_years: int = 5,
    wacc_override: Optional[float] = None,
    terminal_growth: Optional[float] = None,
) -> dict:
    """
    Ejecuta valuación DCF (Discounted Cash Flow) completa.

    Calcula FCFF proyectado, WACC (vía CAPM), Valor Terminal, Enterprise Value, Equity Value.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        projection_years: Años a proyectar (default 5)
        wacc_override: Sobreescribir WACC calculado (opcional)
        terminal_growth: Tasa crecimiento terminal (default 2-3%)
    """
    try:
        payload = {"clientId": client_id, "projectionYears": projection_years}
        if wacc_override is not None:
            payload["waccOverride"] = wacc_override
        if terminal_growth is not None:
            payload["terminalGrowth"] = terminal_growth
        resp = httpx.post(
            f"{FINANCE_SERVICE_URL}/valuation/dcf",
            json=payload,
            headers={"X-Tenant-Id": tenant_id},
            timeout=30.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error DCF: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def run_monte_carlo_simulation(
    client_id: str,
    tenant_id: str,
    iterations: int = 10000,
    variables_to_vary: Optional[List[str]] = None,
) -> dict:
    """
    Ejecuta simulación Monte Carlo para valuación con distribución de probabilidad.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        iterations: Número de iteraciones (1K-100K)
        variables_to_vary: ["wacc", "growth", "margin", "terminal_multiple"]

    Returns:
        Distribución con percentiles P5, P25, P50, P75, P95, mean, std_dev
    """
    try:
        resp = httpx.post(
            f"{FINANCE_SERVICE_URL}/valuation/monte-carlo",
            json={
                "clientId": client_id,
                "iterations": iterations,
                "variables": variables_to_vary or ["wacc", "growth", "margin"],
            },
            headers={"X-Tenant-Id": tenant_id},
            timeout=60.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error Monte Carlo: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def get_cash_projection(
    client_id: str,
    tenant_id: str,
    months: int = 12,
    scenario: str = "base",
    custom_params: Optional[dict] = None,
) -> dict:
    """
    Proyecta flujo de caja a N meses bajo diferentes escenarios.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        months: Meses a proyectar (default 12)
        scenario: "base", "optimistic", "pessimistic", "stress", "custom"
        custom_params: Dict con overrides para scenario="custom"
    """
    try:
        payload = {"clientId": client_id, "months": months, "scenario": scenario}
        if custom_params:
            payload["customParams"] = custom_params
        resp = httpx.post(
            f"{FINANCE_SERVICE_URL}/projections/cash-flow",
            json=payload,
            headers={"X-Tenant-Id": tenant_id},
            timeout=15.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error proyección: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def calculate_synergies(
    acquirer_client_id: str,
    target_client_id: str,
    tenant_id: str,
    synergy_types: Optional[List[str]] = None,
) -> dict:
    """
    Cuantifica sinergias potenciales en operación M&A.

    Args:
        acquirer_client_id: ID del cliente adquirente
        target_client_id: ID del cliente target
        tenant_id: ID del tenant
        synergy_types: ["revenue", "cost", "financial", "tax"]
    """
    try:
        resp = httpx.post(
            f"{FINANCE_SERVICE_URL}/valuation/synergies",
            json={
                "acquirerId": acquirer_client_id,
                "targetId": target_client_id,
                "types": synergy_types or ["revenue", "cost", "financial"],
            },
            headers={"X-Tenant-Id": tenant_id},
            timeout=20.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error sinergias: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def get_financial_statements(
    client_id: str,
    tenant_id: str,
    years: int = 5,
    statement_type: str = "all",
) -> dict:
    """
    Obtiene estados financieros históricos del cliente.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        years: Años de historia (default 5)
        statement_type: "all", "income", "balance", "cash_flow"
    """
    try:
        resp = httpx.get(
            f"{FINANCE_SERVICE_URL}/statements/{client_id}",
            params={"years": years, "type": statement_type},
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error estados: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def compare_with_benchmark(
    client_id: str,
    tenant_id: str,
    sector: Optional[str] = None,
) -> dict:
    """
    Compara ratios del cliente con benchmark sectorial (P25/P50/P75).

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        sector: Sector específico (si no, usa sector del cliente)
    """
    try:
        resp = httpx.get(
            f"{FINANCE_SERVICE_URL}/benchmark/{client_id}",
            params={"sector": sector} if sector else {},
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error benchmark: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def detect_financial_anomalies(
    client_id: str,
    tenant_id: str,
) -> dict:
    """
    Detecta anomalías en datos financieros usando ML (Isolation Forest).
    Identifica transacciones atípicas, ratios fuera de rango, patrones sospechosos.
    """
    try:
        resp = httpx.get(
            f"{FINANCE_SERVICE_URL}/anomalies/{client_id}",
            headers={"X-Tenant-Id": tenant_id},
            timeout=15.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error anomalías: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}
