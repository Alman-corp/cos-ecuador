"""Finance Service FastAPI — Financial Engines for Ecuador.
DCF Valuation, CAPM, Financial Ratios, Amortization, Monte Carlo, Projections.
"""

import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent))

from api.dcf import router as dcf_router
from api.ratios import router as ratios_router
from api.valuation import router as valuation_router
from api.projections import router as projections_router
from api.market import router as market_router

app = FastAPI(
    title="Finance Service — Financial Engines for Ecuador",
    description="""
    API de análisis financiero para el sistema de consultoría ecuatoriano.
    
    **Módulos disponibles:**
    - DCF Valuation (Flujo de Caja Descontado)
    - Monte Carlo Simulation
    - CAPM & WACC
    - Financial Ratios (Liquidez, Rentabilidad, Endeudamiento, Eficiencia)
    - Loan Amortization (Francés, Americano, Alemán)
    - Financial Projections (EEFF proyectados)
    - Market Data (Riesgo país, tasas de referencia)
    """,
    version="1.0.0",
    contact={
        "name": "Consultoría Ecuador — Finance Service",
        "url": "https://github.com/consultoria-ec/finance",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dcf_router)
app.include_router(ratios_router)
app.include_router(valuation_router)
app.include_router(projections_router)
app.include_router(market_router)


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
        "service": "finance-service",
        "version": "1.0.0",
        "modules": [
            "dcf",
            "ratios",
            "valuation",
            "projections",
            "market",
        ],
    }


@app.get(
    "/",
    summary="Root",
    description="Información general del servicio.",
)
async def root() -> Dict:
    return {
        "service": "Finance Service — Financial Engines for Ecuador",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }
