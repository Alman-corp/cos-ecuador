"""
Tools específicas del agente tributario.
Cada tool llama al microservicio Tax (FastAPI).
"""
from langchain_core.tools import tool
import httpx
from typing import Optional

TAX_SERVICE_URL = "http://tax-service:8000/api/v1"


@tool
def get_fiscal_calendar(client_id: str, tenant_id: str, days_ahead: int = 30) -> dict:
    """
    Obtiene las obligaciones tributarias próximas del cliente.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        days_ahead: Cuántos días hacia adelante consultar (default 30)

    Returns:
        Lista de obligaciones con fechas de vencimiento, tipo y estado.
    """
    try:
        resp = httpx.get(
            f"{TAX_SERVICE_URL}/fiscal-calendar",
            params={"clientId": client_id, "daysAhead": days_ahead},
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error obteniendo calendario: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def calculate_iva(
    ingresos_0: float,
    ingresos_12: float,
    ingresos_15: float,
    iva_compras: float,
    retenciones_recibidas: float,
) -> dict:
    """
    Calcula el IVA mensual a pagar según la normativa ecuatoriana vigente.

    Args:
        ingresos_0: Ingresos gravados a tarifa 0%
        ingresos_12: Ingresos gravados a tarifa 12%
        ingresos_15: Ingresos gravados a tarifa 15%
        iva_compras: Crédito tributario (IVA pagado en compras)
        retenciones_recibidas: Retenciones de IVA recibidas

    Returns:
        Detalle del cálculo con IVA a pagar o saldo a favor.
    """
    try:
        resp = httpx.post(
            f"{TAX_SERVICE_URL}/iva/calcular",
            json={
                "ingresos0": ingresos_0,
                "ingresos12": ingresos_12,
                "ingresos15": ingresos_15,
                "ivaCompras": iva_compras,
                "retencionesRecibidas": retenciones_recibidas,
            },
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"Error calculando IVA: {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@tool
def check_obligation_status(obligation_id: str, tenant_id: str) -> dict:
    """
    Verifica el estado actual de una obligación tributaria específica.

    Args:
        obligation_id: ID de la obligación
        tenant_id: ID del tenant
    """
    try:
        resp = httpx.get(
            f"{TAX_SERVICE_URL}/obligations/{obligation_id}",
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": "Obligación no encontrada"}
    except Exception as e:
        return {"error": str(e)}


@tool
def get_retention_rate(service_type: str) -> dict:
    """
    Obtiene el porcentaje de retención en la fuente según el tipo de servicio.
    Conforme al Art. 368 del Reglamento a la LRTI.

    Args:
        service_type: Tipo de servicio (honorarios, arrendamiento, servicios, etc.)

    Returns:
        Porcentaje aplicable y artículo de ley.
    """
    rates = {
        "honorarios_profesionales": {"rate": 0.10, "article": "Art. 368 RLRTI - Servicios profesionales"},
        "arrendamiento_mercantil": {"rate": 0.08, "article": "Art. 368 RLRTI - Arrendamiento mercantil"},
        "arrendamiento_inmuebles": {"rate": 0.08, "article": "Art. 368 RLRTI - Arrendamiento de inmuebles"},
        "servicios_personales": {"rate": 0.10, "article": "Art. 368 RLRTI - Servicios personales"},
        "servicios_no_personales": {"rate": 0.01, "article": "Art. 368 RLRTI - Otros servicios"},
        "comisiones": {"rate": 0.10, "article": "Art. 368 RLRTI - Comisiones"},
        "publicidad": {"rate": 0.01, "article": "Art. 368 RLRTI - Publicidad y comunicación"},
        "transporte": {"rate": 0.01, "article": "Art. 368 RLRTI - Transporte"},
        "combustibles": {"rate": 0.01, "article": "Art. 368 RLRTI - Combustibles"},
    }

    service_lower = service_type.lower().replace(" ", "_")
    if service_lower in rates:
        return rates[service_lower]

    return {
        "rate": None,
        "article": "Tipo no encontrado. Consulte Art. 368 RLRTI completo.",
        "available_types": list(rates.keys()),
    }


@tool
def search_sri_legislation(query: str, law_type: Optional[str] = None) -> dict:
    """
    Busca artículos de la legislación tributaria ecuatoriana mediante RAG.

    Args:
        query: Pregunta o tema a buscar
        law_type: Tipo de ley (LRTI, RLRTI, CODIGO_TRIBUTARIO, RESOLUCIONES)

    Returns:
        Artículos relevantes con cita exacta.
    """
    try:
        resp = httpx.post(
            f"{TAX_SERVICE_URL}/legislation/search",
            json={"query": query, "lawType": law_type, "topK": 5},
            timeout=15.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": "Error buscando legislación"}
    except Exception as e:
        return {"error": str(e)}


@tool
def get_client_tax_profile(client_id: str, tenant_id: str) -> dict:
    """
    Obtiene el perfil tributario completo de un cliente.

    Returns:
        RUC, régimen, obligaciones, historial de declaraciones.
    """
    try:
        resp = httpx.get(
            f"{TAX_SERVICE_URL}/clients/{client_id}/profile",
            headers={"X-Tenant-Id": tenant_id},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": "Cliente no encontrado"}
    except Exception as e:
        return {"error": str(e)}


@tool
def simulate_tax_scenario(
    client_id: str,
    tenant_id: str,
    scenario_type: str,
    parameters: dict,
) -> dict:
    """
    Simula escenarios tributarios what-if.

    Args:
        client_id: ID del cliente
        tenant_id: ID del tenant
        scenario_type: Tipo (change_regimen, add_employees, increase_revenue, etc.)
        parameters: Parámetros del escenario

    Returns:
        Impacto proyectado en IVA, Renta, Retenciones.
    """
    try:
        resp = httpx.post(
            f"{TAX_SERVICE_URL}/scenarios/simulate",
            json={
                "clientId": client_id,
                "scenarioType": scenario_type,
                "parameters": parameters,
            },
            headers={"X-Tenant-Id": tenant_id},
            timeout=20.0,
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": "Error en simulación"}
    except Exception as e:
        return {"error": str(e)}
