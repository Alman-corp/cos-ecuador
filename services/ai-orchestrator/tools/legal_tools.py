"""
Tools del Agente Legal — Motor M11.
"""
from langchain_core.tools import tool
import httpx
from typing import Optional, List

LEGAL_SERVICE_URL = "http://legal-service:8000/api/v1"


@tool
def get_contract_summary(contract_id: str, tenant_id: str) -> dict:
    """
    Obtiene resumen ejecutivo de un contrato.

    Args:
        contract_id: ID del contrato
        tenant_id: ID del tenant

    Returns:
        Resumen con tipo, partes, fechas, valor, estado, obligaciones pendientes
    """
    try:
        resp = httpx.get(
            f"{LEGAL_SERVICE_URL}/contracts/{contract_id}/summary",
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def list_client_contracts(
    client_id: str,
    tenant_id: str,
    status_filter: Optional[str] = None,
) -> dict:
    """
    Lista todos los contratos de un cliente.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        status_filter: "ACTIVE", "EXPIRING_SOON", "OVERDUE", "ALL"
    """
    try:
        resp = httpx.get(
            f"{LEGAL_SERVICE_URL}/clients/{client_id}/contracts",
            params={"status": status_filter or "ALL"},
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def get_upcoming_obligations(
    tenant_id: str,
    client_id: Optional[str] = None,
    days_ahead: int = 30,
) -> dict:
    """
    Obtiene obligaciones contractuales próximas a vencer.

    Args:
        tenant_id: ID del tenant
        client_id: Filtrar por cliente (opcional)
        days_ahead: Días hacia adelante (default 30)

    Returns:
        Obligaciones agrupadas por urgencia: critical (1-3d), urgent (4-7d), upcoming (8-30d)
    """
    try:
        params = {"daysAhead": days_ahead}
        if client_id:
            params["clientId"] = client_id
        resp = httpx.get(
            f"{LEGAL_SERVICE_URL}/obligations/upcoming",
            params=params,
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def analyze_contract_risk(contract_id: str, tenant_id: str) -> dict:
    """
    Analiza riesgo contractual usando IA.
    Detecta: cláusulas desbalanceadas, penalizaciones excesivas, ausencia de límites.

    Returns:
        Score de riesgo (0-100), cláusulas problemáticas con sugerencias
    """
    try:
        resp = httpx.post(
            f"{LEGAL_SERVICE_URL}/contracts/{contract_id}/analyze-risk",
            headers={"X-Tenant-Id": tenant_id},
            timeout=30.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error análisis: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def search_legal_framework(
    query: str,
    jurisdiction: str = "ECUADOR",
    law_type: Optional[str] = None,
) -> dict:
    """
    Busca en el marco legal ecuatoriano vía RAG.

    Args:
        query: Pregunta legal
        jurisdiction: "ECUADOR" (default), "INTERNATIONAL"
        law_type: "CIVIL", "COMMERCIAL", "LABOR", "TAX", "CONSUMER"

    Returns:
        Artículos relevantes con citas
    """
    try:
        resp = httpx.post(
            f"{LEGAL_SERVICE_URL}/legal-framework/search",
            json={"query": query, "jurisdiction": jurisdiction, "lawType": law_type, "topK": 5},
            timeout=15.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error búsqueda: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def get_compliance_checklist(
    client_id: str,
    tenant_id: str,
    industry: Optional[str] = None,
) -> dict:
    """
    Genera checklist de cumplimiento normativo por industria.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        industry: Industria (banca, salud, retail, etc.)
    """
    try:
        resp = httpx.get(
            f"{LEGAL_SERVICE_URL}/compliance/{client_id}/checklist",
            params={"industry": industry} if industry else {},
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error checklist: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def compare_contract_versions(contract_id: str, tenant_id: str, version_a: int, version_b: int) -> dict:
    """
    Compara dos versiones de un contrato y muestra cambios.

    Args:
        contract_id: ID del contrato
        tenant_id: ID del tenant
        version_a: Versión A
        version_b: Versión B

    Returns:
        Diff estructurado con cambios críticos destacados
    """
    try:
        resp = httpx.get(
            f"{LEGAL_SERVICE_URL}/contracts/{contract_id}/diff",
            params={"versionA": version_a, "versionB": version_b},
            headers={"X-Tenant-Id": tenant_id},
            timeout=15.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error diff: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}
