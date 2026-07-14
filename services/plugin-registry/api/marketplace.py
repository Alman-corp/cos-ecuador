"""API endpoints para marketplace de plugins."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from engines.marketplace_engine import MarketplaceEngine

router = APIRouter(prefix="/api/v1/marketplace", tags=["Marketplace"])
engine = MarketplaceEngine()


@router.get(
    "/plugins",
    summary="Listar plugins del marketplace",
    description="Obtiene el catálogo de plugins disponibles con filtrado por categoría, búsqueda y paginación.",
)
async def list_plugins(
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    search: Optional[str] = Query(None, description="Buscar por nombre, descripción o tags"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=50, description="Elementos por página"),
):
    return engine.list_plugins(category, search, page, limit)


@router.get(
    "/plugins/{plugin_id}",
    summary="Detalle de plugin",
    description="Obtiene la información completa de un plugin del marketplace.",
)
async def get_plugin(plugin_id: str):
    plugin = engine.get_plugin(plugin_id)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' no encontrado.")
    return plugin


@router.get(
    "/categories",
    summary="Listar categorías",
    description="Obtiene todas las categorías disponibles en el marketplace.",
)
async def list_categories():
    return engine.get_categories()


@router.get(
    "/featured",
    summary="Plugins destacados",
    description="Obtiene los plugins destacados del marketplace.",
)
async def get_featured():
    return engine.get_featured()
