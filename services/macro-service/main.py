"""Macro Service — MIDAS Nowcasting & BVAR Forecasting for Ecuador."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from api.midas import router as midas_router
from api.bvar import router as bvar_router
from engines.macro_data import router as data_router

app = FastAPI(
    title="Macro Service — MIDAS Nowcasting & BVAR Forecasting for Ecuador",
    description="""
    API de nowcasting MIDAS y forecasting BVAR para indicadores macroeconómicos del Ecuador.

    **Módulos disponibles:**
    - Datos macroeconómicos (PIB, petróleo, remesas, etc.)
    - MIDAS (Mixed Data Sampling) — Nowcasting trimestral con datos mensuales
    - BVAR (Bayesian VAR) — Forecasting multivariante con priors Minnesota
    """,
    version="1.0.0",
    contact={
        "name": "Consultoría Ecuador — Macro Service",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_router)
app.include_router(midas_router)
app.include_router(bvar_router)


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


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "macro-service",
        "version": "1.0.0",
        "engines": ["data", "midas", "bvar"],
    }


@app.get("/")
async def root():
    return {
        "service": "Macro Service — MIDAS Nowcasting & BVAR Forecasting for Ecuador",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
        "endpoints": {
            "data": "/api/v1/macro/data",
            "midas": "/api/v1/macro/midas",
            "bvar": "/api/v1/macro/bvar",
        },
    }
