"""Plugin Registry FastAPI — Marketplace, Plugin Installation, Version Management, and Dependency Resolution."""

import sys
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent))

from api.marketplace import router as marketplace_router
from api.plugins import router as plugins_router

app = FastAPI(
    title="Plugin Registry — Marketplace & Ecosystem",
    description="""
    API de registro de plugins para COS Ecuador.
    
    **Módulos disponibles:**
    - Marketplace (catálogo, categorías, búsqueda)
    - Plugins (instalación, configuración, actualizaciones)
    """,
    version="1.0.0",
    contact={
        "name": "COS Ecuador - Plugin Registry",
        "url": "https://github.com/consultoria-ec/plugin-registry",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(marketplace_router)
app.include_router(plugins_router)


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": str(exc),
            "type": type(exc).__name__,
        },
    )


@app.get(
    "/health",
    summary="Health Check",
    description="Verifica que el servicio esté operativo.",
)
async def health_check() -> Dict:
    return {
        "status": "healthy",
        "service": "plugin-registry",
        "version": "1.0.0",
        "modules": ["marketplace", "plugins"],
    }


@app.get(
    "/",
    summary="Root",
    description="Información general del servicio.",
)
async def root() -> Dict:
    return {
        "service": "Plugin Registry — Marketplace & Ecosystem",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }
