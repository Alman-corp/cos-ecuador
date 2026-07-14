from fastapi import APIRouter, HTTPException
from engine.registry_engine import RegistryEngine

router = APIRouter(prefix="/api/v1/integration", tags=["Registry"])
engine = RegistryEngine()


@router.get("/registry/endpoints", summary="List all known API endpoints across services")
async def list_endpoints():
    return engine.get_endpoints()


@router.get("/registry/graph", summary="Dependency graph between services")
async def get_graph():
    nodes = []
    for svc in engine.get_all():
        nodes.append({
            "id": svc["id"],
            "name": svc["name"],
            "tags": svc["tags"],
            "status": svc["status"],
        })
    return {"nodes": nodes, "edges": engine.get_graph()}


@router.get("/registry", summary="List all registered services")
async def list_registry():
    return engine.get_all()


@router.post("/registry", summary="Register a new service")
async def register_service(data: dict):
    if not data.get("id"):
        raise HTTPException(status_code=400, detail="Field 'id' is required")
    return engine.register(data)


@router.get("/registry/{service_id}", summary="Get service details")
async def get_service(service_id: str):
    service = engine.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.put("/registry/{service_id}", summary="Update service registration")
async def update_service(service_id: str, data: dict):
    existing = engine.get_service(service_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    data["id"] = service_id
    return engine.register(data)


@router.delete("/registry/{service_id}", summary="Unregister a service")
async def unregister_service(service_id: str):
    service = engine.unregister(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"detail": "Service marked as deprecated", "service": service}
