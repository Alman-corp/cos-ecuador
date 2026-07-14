"""API endpoints para consulta e ingesta de logs estructurados."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from engines.logs_engine import LogsEngine, LogEntry, LogStats, LogLevel

router = APIRouter(prefix="/api/v1/observability", tags=["Logs"])
engine = LogsEngine()


@router.get(
    "/logs",
    response_model=dict,
    summary="Listar logs",
    description="Obtiene logs con filtros por servicio, nivel, rango de fechas, búsqueda de texto y paginación.",
)
async def list_logs(
    service: Optional[str] = Query(None, description="Filtrar por servicio"),
    level: Optional[str] = Query(None, description="Filtrar por nivel (DEBUG, INFO, WARNING, ERROR, CRITICAL)"),
    start: Optional[str] = Query(None, description="Inicio del rango (ISO8601)"),
    end: Optional[str] = Query(None, description="Fin del rango (ISO8601)"),
    search: Optional[str] = Query(None, description="Búsqueda de texto en el mensaje"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
):
    results, total = engine.query(
        service=service, level=level, start=start, end=end,
        search=search, page=page, limit=limit,
    )
    return {
        "data": [r.model_dump() for r in results],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.post(
    "/logs",
    response_model=LogEntry,
    summary="Ingestar log",
    description="Registra una nueva entrada de log en el sistema.",
)
async def ingest_log(entry: LogEntry):
    return engine.ingest(entry)


@router.get(
    "/logs/stats",
    response_model=LogStats,
    summary="Estadísticas de logs",
    description="Obtiene estadísticas agregadas de logs: total por nivel, por servicio, errores recientes.",
)
async def get_log_stats():
    return engine.get_stats()


@router.get(
    "/logs/{log_id}",
    response_model=LogEntry,
    summary="Obtener log por ID",
    description="Retorna una entrada de log específica por su identificador único.",
)
async def get_log(log_id: str):
    entry = engine.get(log_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return entry
