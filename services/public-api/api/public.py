"""API endpoints públicos v2 — keys, webhooks, rate limits y simulación."""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict

from engines.api_engine import APIEngine, APICreateKeyRequest

router = APIRouter(prefix="/api/v2", tags=["Public API v2"])
engine = APIEngine()


@router.get(
    "/status",
    summary="Estado de la API",
    description="Retorna el estado actual del servicio de API pública.",
)
async def get_status():
    return engine.simulate_response("/api/v2/status")


@router.post(
    "/keys",
    summary="Crear API Key",
    description="Crea una nueva API key para un tenant con los scopes especificados.",
)
async def create_key(request: APICreateKeyRequest):
    try:
        return engine.create_key(request.tenant_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/keys/{key_id}",
    summary="Detalle de API Key",
    description="Obtiene los detalles de una API key específica (nunca expone la llave completa).",
)
async def get_key(tenant_id: str = Query(..., description="ID del tenant"), key_id: str = None):
    if key_id is None:
        raise HTTPException(status_code=400, detail="key_id es requerido.")
    key = engine.get_key(tenant_id, key_id)
    if not key:
        raise HTTPException(status_code=404, detail="API Key no encontrada.")
    return key


@router.delete(
    "/keys/{key_id}",
    summary="Revocar API Key",
    description="Revoca una API key, inhabilitándola inmediatamente.",
)
async def revoke_key(tenant_id: str = Query(..., description="ID del tenant"), key_id: str = None):
    if key_id is None:
        raise HTTPException(status_code=400, detail="key_id es requerido.")
    try:
        engine.revoke_key(tenant_id, key_id)
        return {"message": f"API Key '{key_id}' revocada correctamente."}
    except ValueError as e:
        raise HTTPException(status_code=404 if "no encontrada" in str(e) else 400, detail=str(e))


@router.get(
    "/keys",
    summary="Listar API Keys",
    description="Lista todas las API keys de un tenant.",
)
async def list_keys(tenant_id: str = Query(..., description="ID del tenant")):
    return engine.list_keys(tenant_id)


@router.get(
    "/usage/{tenant_id}",
    summary="Estadísticas de uso",
    description="Obtiene estadísticas de uso de la API para un tenant.",
)
async def get_usage(tenant_id: str):
    return engine.get_usage(tenant_id)


@router.post(
    "/webhooks/{tenant_id}",
    summary="Registrar webhook",
    description="Registra un nuevo webhook para recibir notificaciones de eventos.",
)
async def register_webhook(tenant_id: str, body: Dict):
    url = body.get("url")
    events = body.get("events", [])
    if not url:
        raise HTTPException(status_code=400, detail="url es requerida.")
    if not events:
        raise HTTPException(status_code=400, detail="events es requerido (lista no vacía).")
    try:
        return engine.register_webhook(tenant_id, url, events)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/webhooks/{tenant_id}",
    summary="Listar webhooks",
    description="Lista todos los webhooks registrados para un tenant.",
)
async def list_webhooks(tenant_id: str):
    return engine.list_webhooks(tenant_id)


@router.delete(
    "/webhooks/{tenant_id}/{webhook_id}",
    summary="Eliminar webhook",
    description="Elimina un webhook registrado.",
)
async def remove_webhook(tenant_id: str, webhook_id: str):
    try:
        engine.remove_webhook(tenant_id, webhook_id)
        return {"message": f"Webhook '{webhook_id}' eliminado correctamente."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/rate-limits/{tenant_id}",
    summary="Estado de rate limits",
    description="Obtiene el estado actual de los límites de tasa para un tenant.",
)
async def get_rate_limits(tenant_id: str):
    return engine.get_rate_limit(tenant_id)


@router.post(
    "/simulate",
    summary="Simular endpoint",
    description="Simula una llamada a cualquier endpoint público para pruebas (sin autenticación).",
)
async def simulate_endpoint(
    endpoint: str = Query(..., description="Ruta del endpoint a simular (ej: /api/v1/tax/iva/calculate)"),
    method: str = Query("GET", description="Método HTTP"),
):
    return engine.simulate_response(endpoint, method)
