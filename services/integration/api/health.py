from fastapi import APIRouter, HTTPException
from engine.registry_engine import RegistryEngine
from engine.health_engine import HealthEngine

router = APIRouter(prefix="/api/v1/integration", tags=["Health"])
registry_engine = RegistryEngine()
health_engine = HealthEngine()


@router.get("/health/all", summary="Aggregate health of ALL services")
async def health_all():
    services = registry_engine.get_all()
    return health_engine.aggregate_health(services)


@router.get("/health/summary", summary="Health summary with counts")
async def health_summary():
    return health_engine.get_summary()


@router.get("/health/history", summary="Last 24h health check results")
async def health_history():
    return health_engine.get_history()


@router.get("/health/{service_id}", summary="Health of specific service")
async def health_service(service_id: str):
    service = registry_engine.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return health_engine.get_service_health(service_id)
