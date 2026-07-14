"""Clients Service FastAPI - Client Management, Contract History, Invoicing, and Portfolio Tracking."""

import sys
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent))

from api.clients import router as clients_router
from api.portfolio import router as portfolio_router

app = FastAPI(
    title="Clients Service — Client & Portfolio Management",
    description="""
    API de gestión de clientes, contratos, facturación y portafolio
    para el sistema de consultoría ecuatoriano.
    """,
    version="1.0.0",
    contact={
        "name": "Consultoría Ecuador",
        "url": "https://github.com/consultoria-ec/clients-service",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio_router)
app.include_router(clients_router)


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


@app.get("/health", summary="Health Check", description="Verifica que el servicio esté operativo.")
async def health_check() -> Dict:
    return {
        "status": "healthy",
        "service": "clients-service",
        "version": "1.0.0",
        "modules": ["clients", "portfolio"],
    }


@app.get("/", summary="Root", description="Información general del servicio.")
async def root() -> Dict:
    return {
        "service": "Clients Service — Client & Portfolio Management",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }
