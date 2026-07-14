"""Public API v2 FastAPI — API Keys, Rate Limiting, Webhooks, and Public Endpoints for External Integrations."""

import sys
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent))

from api.public import router as public_router

app = FastAPI(
    title="Public API v2 — External Integrations & Developer Platform",
    description="""
    API pública v2 para integraciones externas con COS Ecuador.
    
    **Módulos disponibles:**
    - API Keys (creación, gestión, revocación)
    - Webhooks (registro, notificaciones de eventos)
    - Rate Limiting (control y monitoreo de uso)
    - Simulación (endpoints de prueba sin autenticación)
    """,
    version="2.0.0",
    contact={
        "name": "COS Ecuador - Public API v2",
        "url": "https://github.com/consultoria-ec/public-api",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_router)


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
        "service": "public-api",
        "version": "2.0.0",
        "modules": ["api-keys", "webhooks", "rate-limits", "simulation"],
    }


@app.get(
    "/",
    summary="Root",
    description="Información general del servicio.",
)
async def root() -> Dict:
    return {
        "service": "Public API v2 — External Integrations & Developer Platform",
        "version": "2.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }
