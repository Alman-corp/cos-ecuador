"""API endpoints para métricas y dashboard de observabilidad."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from engines.metrics_engine import (
    MetricsEngine, MetricDatapoint, MetricType, MetricSummary, MetricsDashboard,
)

router = APIRouter(prefix="/api/v1/observability", tags=["Metrics"])
engine = MetricsEngine()


@router.get(
    "/metrics",
    response_model=list[str],
    summary="Listar familias de métricas",
    description="Retorna la lista de todas las familias de métricas disponibles.",
)
async def list_metrics():
    return engine.get_families()


@router.post(
    "/metrics",
    response_model=MetricDatapoint,
    summary="Registrar métrica",
    description="Registra un nuevo datapoint de métrica.",
)
async def record_metric(
    metric: str = Query(..., description="Nombre de la métrica"),
    type: str = Query(..., description="Tipo: counter, gauge, histogram, timer"),
    value: float = Query(..., description="Valor numérico"),
    unit: str = Query("", description="Unidad de medida"),
):
    try:
        metric_type = MetricType(type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid metric type: {type}")
    return engine.record(metric, metric_type, value, unit=unit)


@router.get(
    "/metrics/dashboard",
    response_model=MetricsDashboard,
    summary="Dashboard de métricas",
    description="Obtiene un resumen de métricas clave para el dashboard principal.",
)
async def get_dashboard():
    return engine.get_dashboard()


@router.get(
    "/metrics/health",
    response_model=dict,
    summary="Métricas de salud",
    description="Obtiene métricas de salud por servicio: tasas de error, tiempos de respuesta, uptime.",
)
async def get_health_metrics():
    return engine.get_health()


@router.get(
    "/metrics/{metric_name}",
    response_model=dict,
    summary="Consultar métrica",
    description="Obtiene datapoints de una métrica específica con agregación opcional y rango de tiempo.",
)
async def query_metric(
    metric_name: str,
    start: Optional[str] = Query(None, description="Inicio del rango (ISO8601)"),
    end: Optional[str] = Query(None, description="Fin del rango (ISO8601)"),
    aggregation: Optional[str] = Query(None, description="Agregación: avg, sum, min, max"),
):
    data = engine.query(metric_name, start=start, end=end, aggregation=aggregation)
    if not data:
        raise HTTPException(status_code=404, detail=f"Metric '{metric_name}' not found or no data in range")
    if aggregation:
        return data[0]
    return {"metric": metric_name, "datapoints": data, "count": len(data)}
