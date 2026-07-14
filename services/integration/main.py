"""Integration Service — Service Registry, Health Aggregation, API Gateway Orchestration for COS Ecuador."""

import sys
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, str(Path(__file__).parent))

from api.registry import router as registry_router
from api.health import router as health_router
from engine.registry_engine import RegistryEngine

app = FastAPI(
    title="Integration Service — Service Registry & Health Aggregation",
    description="""
    Service Registry, Health Aggregation, and API Gateway Orchestration for COS Ecuador.
    
    **Capabilities:**
    - Service registry with registration, discovery, and dependency graph
    - Health aggregation across all 12 microservices
    - API endpoint catalog
    - Dependency graph visualization
    """,
    version="1.0.0",
    contact={
        "name": "COS Ecuador — Integration Layer",
        "url": "https://github.com/cos-ecuador/integration",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(registry_router)
app.include_router(health_router)

_registry_engine = RegistryEngine()


@app.get("/health", summary="Integration service health check")
async def health_check():
    return {
        "status": "healthy",
        "service": "integration",
        "version": "1.0.0",
        "services_monitored": len(_registry_engine.get_all()),
    }


@app.get("/", summary="Root with links to all registered services")
async def root():
    services = _registry_engine.get_all()
    return {
        "service": "Integration Service — Service Registry & Health Aggregation",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
        "registered_services": [
            {"id": s["id"], "name": s["name"], "url": s["url"], "status": s["status"]}
            for s in services
        ],
        "summary": _registry_engine.get_summary().model_dump(),
    }
