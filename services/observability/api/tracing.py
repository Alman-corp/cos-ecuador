"""API endpoints para tracing distribuido."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from engines.tracing_engine import TracingEngine, Span, Trace

router = APIRouter(prefix="/api/v1/observability", tags=["Tracing"])
engine = TracingEngine()


@router.get(
    "/traces",
    response_model=dict,
    summary="Listar traces",
    description="Obtiene lista de traces con filtros por servicio, duración, estado y rango de tiempo.",
)
async def list_traces(
    service: Optional[str] = Query(None, description="Filtrar por servicio raíz"),
    status: Optional[str] = Query(None, description="Filtrar por estado (OK, ERROR, TIMEOUT)"),
    min_duration: Optional[float] = Query(None, description="Duración mínima en ms"),
    start: Optional[str] = Query(None, description="Inicio del rango (ISO8601)"),
    end: Optional[str] = Query(None, description="Fin del rango (ISO8601)"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
):
    results, total = engine.list_traces(
        service=service, status=status, min_duration=min_duration,
        start=start, end=end, page=page, limit=limit,
    )
    return {
        "data": [t.model_dump() for t in results],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.post(
    "/traces",
    response_model=Span,
    summary="Ingestar span",
    description="Registra un nuevo span de tracing en el sistema.",
)
async def ingest_span(span: Span):
    return engine.ingest_span(span)


@router.get(
    "/traces/search",
    response_model=list[Trace],
    summary="Buscar traces por tag",
    description="Busca traces que contengan spans con un tag específico.",
)
async def search_traces(
    key: str = Query(..., description="Clave del tag"),
    value: str = Query(..., description="Valor del tag"),
):
    return engine.search_traces(key, value)


@router.get(
    "/traces/{trace_id}",
    response_model=Trace,
    summary="Obtener trace completo",
    description="Retorna un trace completo con todos sus spans y el árbol de llamadas.",
)
async def get_trace(trace_id: str):
    trace = engine.get_trace(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trace
