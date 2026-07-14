"""API endpoints para auditoría de acciones del sistema."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from engines.audit_engine import AuditEngine, AuditEntry, AuditSummary, AuditAction

router = APIRouter(prefix="/api/v1/observability", tags=["Audit"])
engine = AuditEngine()


@router.get(
    "/audit",
    response_model=dict,
    summary="Listar eventos de auditoría",
    description="Obtiene eventos de auditoría con filtros por actor, acción, recurso, rango de fechas y paginación.",
)
async def list_audit(
    actor: Optional[str] = Query(None, description="Filtrar por actor (email o nombre)"),
    action: Optional[str] = Query(None, description="Filtrar por acción (CREATE, UPDATE, DELETE, LOGIN, etc.)"),
    resource: Optional[str] = Query(None, description="Filtrar por tipo de recurso"),
    resource_id: Optional[str] = Query(None, description="Filtrar por ID de recurso"),
    service: Optional[str] = Query(None, description="Filtrar por servicio"),
    start: Optional[str] = Query(None, description="Inicio del rango (ISO8601)"),
    end: Optional[str] = Query(None, description="Fin del rango (ISO8601)"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
):
    results, total = engine.query(
        actor=actor, action=action, resource=resource, resource_id=resource_id,
        service=service, start=start, end=end, page=page, limit=limit,
    )
    return {
        "data": [e.model_dump() for e in results],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.post(
    "/audit",
    response_model=AuditEntry,
    summary="Registrar evento de auditoría",
    description="Registra un nuevo evento de auditoría en el sistema.",
)
async def record_audit(entry: AuditEntry):
    return engine.record(entry)


@router.get(
    "/audit/summary",
    response_model=AuditSummary,
    summary="Resumen de auditoría",
    description="Obtiene estadísticas agregadas de eventos de auditoría.",
)
async def get_audit_summary():
    return engine.get_summary()


@router.get(
    "/audit/{audit_id}",
    response_model=AuditEntry,
    summary="Obtener evento de auditoría",
    description="Retorna un evento de auditoría específico por su ID.",
)
async def get_audit_entry(audit_id: str):
    entry = engine.get(audit_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Audit entry not found")
    return entry
