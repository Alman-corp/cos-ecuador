"""Disaster Recovery FastAPI — Multi-AZ Failover, Backup Automation, DR Drills, and Business Continuity for COS Ecuador."""

import sys
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent))

from api.dr import router as dr_router

app = FastAPI(
    title="DR Service — Disaster Recovery & Business Continuity",
    description="""
    API de Disaster Recovery para el sistema COS Ecuador.
    
    **Capacidades:**
    - Failover/Failback multi-región
    - Backup Automation
    - DR Drills y Business Continuity
    - RTO/RPO Monitoring
    """,
    version="1.0.0",
    contact={
        "name": "COS Ecuador - DR Team",
        "url": "https://github.com/cos-ec/dr-service",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dr_router)


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
    description="Verifica que el servicio DR esté operativo.",
)
async def health_check() -> Dict:
    return {
        "status": "healthy",
        "service": "dr-service",
        "version": "1.0.0",
        "capabilities": [
            "failover",
            "failback",
            "backup",
            "drills",
            "rto",
            "rpo",
        ],
    }


@app.get(
    "/",
    summary="Root",
    description="Información general del servicio DR.",
)
async def root() -> Dict:
    return {
        "service": "DR Service — Disaster Recovery & Business Continuity",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }
