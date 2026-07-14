"""API endpoints para Disaster Recovery: failover, failback, backups, drills, RTO/RPO."""

from fastapi import APIRouter, HTTPException, Path
from typing import Dict, List

from engines.dr_engine import (
    DREngine,
    FailoverRequest,
    DRReadinessReport,
    RegionZone,
    FailoverResult,
    BackupInfo,
    DRDrill,
)

router = APIRouter(prefix="/api/v1/dr", tags=["Disaster Recovery"])
engine = DREngine()


@router.get(
    "/status",
    response_model=DRReadinessReport,
    summary="Estado general de DR",
    description="Retorna el reporte completo de readiness del Disaster Recovery.",
)
async def get_dr_status():
    """Obtiene el estado general de preparación del DR."""
    return engine.get_readiness()


@router.get(
    "/regions",
    response_model=Dict[str, list[RegionZone]],
    summary="Regiones y zonas disponibles",
    description="Lista todas las regiones y zonas con su estado de salud.",
)
async def get_regions():
    """Obtiene todas las regiones y zonas monitoreadas."""
    return engine.get_regions()


@router.post(
    "/failover/{service_name}",
    response_model=FailoverResult,
    summary="Simular failover",
    description="Ejecuta una simulación de failover para un servicio hacia una región/zona objetivo.",
)
async def failover_service(
    service_name: str = Path(..., description="Nombre del servicio"),
    request: FailoverRequest = None,
):
    """Simula un failover para el servicio especificado."""
    try:
        return engine.failover(service_name, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en failover: {str(e)}")


@router.post(
    "/failback/{service_name}",
    response_model=FailoverResult,
    summary="Simular failback",
    description="Ejecuta una simulación de failback para un servicio hacia su región primaria.",
)
async def failback_service(
    service_name: str = Path(..., description="Nombre del servicio"),
):
    """Simula un failback para el servicio especificado."""
    try:
        return engine.failback(service_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en failback: {str(e)}")


@router.get(
    "/backups/{service_name}",
    response_model=List[BackupInfo],
    summary="Listar backups",
    description="Lista el historial de backups de un servicio.",
)
async def get_backups(
    service_name: str = Path(..., description="Nombre del servicio"),
):
    """Obtiene la lista de backups para un servicio."""
    try:
        return engine.get_backups(service_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/backups/{service_name}",
    response_model=BackupInfo,
    summary="Ejecutar backup",
    description="Dispara un backup inmediato para el servicio especificado.",
)
async def trigger_backup(
    service_name: str = Path(..., description="Nombre del servicio"),
):
    """Ejecuta un backup para el servicio indicado."""
    try:
        return engine.trigger_backup(service_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creando backup: {str(e)}")


@router.get(
    "/drills",
    response_model=List[DRDrill],
    summary="Historial de drills",
    description="Lista el historial de ejercicios de DR realizados.",
)
async def get_drills():
    """Obtiene el listado completo de drills de DR."""
    return engine.get_drills()


@router.post(
    "/drills",
    response_model=DRDrill,
    summary="Ejecutar drill",
    description="Ejecuta un nuevo ejercicio de DR con los servicios y tipo especificados.",
)
async def execute_drill(drill: DRDrill):
    """Ejecuta un nuevo drill de DR."""
    try:
        return engine.execute_drill(drill)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error ejecutando drill: {str(e)}")


@router.get(
    "/rto/{service_name}",
    summary="RTO del servicio",
    description="Recovery Time Objective — tiempo estimado de recuperación del servicio.",
)
async def get_rto(
    service_name: str = Path(..., description="Nombre del servicio"),
):
    """Obtiene el RTO (Recovery Time Objective) del servicio."""
    try:
        return engine.get_rto(service_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/rpo/{service_name}",
    summary="RPO del servicio",
    description="Recovery Point Objective — pérdida de datos estimada del servicio.",
)
async def get_rpo(
    service_name: str = Path(..., description="Nombre del servicio"),
):
    """Obtiene el RPO (Recovery Point Objective) del servicio."""
    try:
        return engine.get_rpo(service_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
