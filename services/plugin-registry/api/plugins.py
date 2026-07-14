"""API endpoints para gestión de plugins instalados."""

from fastapi import APIRouter, HTTPException
from typing import Dict

from engines.marketplace_engine import MarketplaceEngine, PluginInstallRequest

router = APIRouter(prefix="/api/v1/plugins", tags=["Plugins"])
engine = MarketplaceEngine()


@router.get(
    "/installed/{tenant_id}",
    summary="Plugins instalados",
    description="Lista los plugins instalados para un tenant con detección de actualizaciones disponibles.",
)
async def get_installed(tenant_id: str):
    return engine.check_updates(tenant_id)


@router.post(
    "/install/{tenant_id}",
    summary="Instalar plugin",
    description="Instala un plugin del marketplace en el tenant especificado.",
)
async def install_plugin(tenant_id: str, request: PluginInstallRequest):
    try:
        return engine.install(tenant_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/uninstall/{tenant_id}",
    summary="Desinstalar plugin",
    description="Desinstala un plugin del tenant especificado.",
)
async def uninstall_plugin(tenant_id: str, body: Dict):
    plugin_id = body.get("plugin_id")
    if not plugin_id:
        raise HTTPException(status_code=400, detail="plugin_id es requerido.")
    try:
        engine.uninstall(tenant_id, plugin_id)
        return {"message": f"Plugin '{plugin_id}' desinstalado correctamente."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post(
    "/configure/{tenant_id}/{plugin_id}",
    summary="Configurar plugin",
    description="Actualiza la configuración de un plugin instalado.",
)
async def configure_plugin(tenant_id: str, plugin_id: str, config: Dict):
    try:
        return engine.configure(tenant_id, plugin_id, config)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/updates/{tenant_id}",
    summary="Actualizaciones disponibles",
    description="Verifica si hay versiones más recientes de los plugins instalados.",
)
async def check_updates(tenant_id: str):
    return engine.check_updates(tenant_id)


@router.post(
    "/update/{tenant_id}/{plugin_id}",
    summary="Actualizar plugin",
    description="Actualiza un plugin instalado a su versión más reciente.",
)
async def update_plugin(tenant_id: str, plugin_id: str):
    try:
        return engine.update_plugin(tenant_id, plugin_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
