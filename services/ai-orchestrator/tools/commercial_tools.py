"""
Tools del Agente Comercial — CRM, pipeline, equalas.
"""
from langchain_core.tools import tool
import httpx
from typing import Optional, List

CRM_SERVICE_URL = "http://crm-service:8000/api/v1"


@tool
def get_pipeline_summary(tenant_id: str) -> dict:
    """
    Resumen del pipeline de ventas por etapa: total oportunidades, valor total,
    valor ponderado, deals próximos, tasa de conversión.
    """
    try:
        resp = httpx.get(
            f"{CRM_SERVICE_URL}/pipeline/summary",
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def list_opportunities(
    tenant_id: str,
    stage: Optional[str] = None,
    assigned_to: Optional[str] = None,
    limit: int = 50,
) -> dict:
    """
    Lista oportunidades del pipeline con filtros.

    Args:
        tenant_id: ID del tenant
        stage: "LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"
        assigned_to: Filtrar por consultor asignado
        limit: Máximo resultados
    """
    try:
        params = {"limit": limit}
        if stage:
            params["stage"] = stage
        if assigned_to:
            params["assignedTo"] = assigned_to
        resp = httpx.get(
            f"{CRM_SERVICE_URL}/opportunities",
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
def get_opportunity_details(opportunity_id: str, tenant_id: str) -> dict:
    """Detalle completo de una oportunidad: cliente, actividades, timeline."""
    try:
        resp = httpx.get(
            f"{CRM_SERVICE_URL}/opportunities/{opportunity_id}",
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def score_lead(
    client_name: str,
    industry: str,
    company_size: str,
    tenant_id: str,
    additional_info: Optional[dict] = None,
) -> dict:
    """
    Calcula score de un lead usando modelo de scoring MEDDIC.

    Args:
        client_name: Nombre del prospecto
        industry: Industria
        company_size: "small" (1-10), "medium" (11-50), "large" (51+)
        tenant_id: ID del tenant
        additional_info: Datos adicionales (revenue, ubicación, etc.)

    Returns:
        Score (0-100), razones, ICP fit (ALTO/MEDIO/BAJO)
    """
    try:
        resp = httpx.post(
            f"{CRM_SERVICE_URL}/leads/score",
            json={
                "clientName": client_name,
                "industry": industry,
                "companySize": company_size,
                "additionalInfo": additional_info or {},
            },
            headers={"X-Tenant-Id": tenant_id},
            timeout=15.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error scoring: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def match_consultant_to_client(
    client_id: str,
    tenant_id: str,
    required_skills: Optional[List[str]] = None,
) -> dict:
    """
    Sugiere el mejor consultor para un cliente basado en skills, carga y experiencia.

    Returns:
        Top-3 consultores con score y razones
    """
    try:
        resp = httpx.post(
            f"{CRM_SERVICE_URL}/matching/consultant",
            json={"clientId": client_id, "requiredSkills": required_skills or []},
            headers={"X-Tenant-Id": tenant_id},
            timeout=15.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error matching: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def generate_proposal_outline(opportunity_id: str, tenant_id: str, proposal_type: str = "standard") -> dict:
    """
    Genera outline de propuesta comercial personalizado.

    Args:
        opportunity_id: ID de la oportunidad
        tenant_id: ID del tenant
        proposal_type: "standard", "audit", "retainer", "project"

    Returns:
        Estructura con secciones, pricing sugerido, timeline, entregables
    """
    try:
        resp = httpx.post(
            f"{CRM_SERVICE_URL}/proposals/{opportunity_id}/outline",
            json={"type": proposal_type},
            headers={"X-Tenant-Id": tenant_id},
            timeout=20.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error proposal: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def forecast_revenue(tenant_id: str, months_ahead: int = 6) -> dict:
    """
    Forecast de revenue basado en pipeline actual + histórico.

    Returns:
        Proyección mensual: committed, best case, pipeline total, confianza
    """
    try:
        resp = httpx.get(
            f"{CRM_SERVICE_URL}/forecast/revenue",
            params={"months": months_ahead},
            headers={"X-Tenant-Id": tenant_id},
            timeout=15.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error forecast: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def get_client_360(client_id: str, tenant_id: str) -> dict:
    """
    Vista 360° del cliente: histórico comercial, proyectos, facturación, satisfacción.
    """
    try:
        resp = httpx.get(
            f"{CRM_SERVICE_URL}/clients/{client_id}/360",
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error 360: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}
