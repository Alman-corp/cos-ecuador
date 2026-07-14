"""Observability Service FastAPI — Logs, Metrics, Tracing & Audit para COS Ecuador."""

import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent))

from api.logs import router as logs_router
from api.metrics import router as metrics_router
from api.tracing import router as tracing_router
from api.audit import router as audit_router

app = FastAPI(
    title="Observability Service — Logs, Metrics, Tracing & Audit",
    description="""
    Servicio centralizado de observabilidad para el ecosistema COS Ecuador.
    
    **Módulos disponibles:**
    - Logs estructurados (ingesta, consulta, estadísticas)
    - Métricas (contadores, gauges, timers, histogramas)
    - Tracing distribuido (spans, trazas completas)
    - Auditoría (registro de acciones, resúmenes)
    """,
    version="1.0.0",
    contact={
        "name": "COS Ecuador — Observability",
        "url": "https://github.com/cos-ec/observability",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(logs_router)
app.include_router(metrics_router)
app.include_router(tracing_router)
app.include_router(audit_router)


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
    description="Verifica que el servicio de observabilidad esté operativo.",
    tags=["Health"],
)
async def health_check() -> Dict:
    return {
        "status": "healthy",
        "service": "observability",
        "version": "1.0.0",
        "modules": ["logs", "metrics", "tracing", "audit"],
    }


@app.get(
    "/",
    summary="Root",
    description="Información general del servicio de observabilidad.",
    tags=["Root"],
)
async def root() -> Dict:
    return {
        "service": "Observability Service — Logs, Metrics, Tracing & Audit",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }
