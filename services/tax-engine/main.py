"""Tax Engine FastAPI - Servicio de Cálculos Tributarios Ecuatorianos.
Fase 4: IVA, Retenciones, Renta, ICE, ATS, SRI.
"""

import sys
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from decimal import Decimal
from typing import Dict

sys.path.insert(0, str(Path(__file__).parent))

from api.iva import router as iva_router
from api.renta import router as renta_router
from api.retenciones import router as retenciones_router
from api.ice import router as ice_router
from api.anexos import router as anexos_router
from api.sri import router as sri_router
from sri.soap_client import SRIError

app = FastAPI(
    title="Tax Engine - Servicio de Cálculos Tributarios Ecuador",
    description="""
    API de cálculos tributarios para el sistema de consultoría ecuatoriano.
    
    **Módulos disponibles:**
    - IVA (Formulario 104 mensual/semestral)
    - Retenciones en la Fuente (1%, 2%, 8%, 10%, 25%)
    - Impuesto a la Renta (28% sociedades, tabla progresiva personal)
    - ICE (Impuesto a los Consumos Especiales)
    - Anexos (ATS v2.7, validación XSD)
    - SRI (Envío y autorización de comprobantes electrónicos)
    """,
    version="1.0.0",
    contact={
        "name": "Consultoría Ecuador - Fase 4",
        "url": "https://github.com/consultoria-ec/tax-engine",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(iva_router)
app.include_router(renta_router)
app.include_router(retenciones_router)
app.include_router(ice_router)
app.include_router(anexos_router)
app.include_router(sri_router)


@app.exception_handler(SRIError)
async def sri_error_handler(request: Request, exc: SRIError):
    return JSONResponse(
        status_code=502,
        content={
            "error": exc.code,
            "message": exc.message,
            "type": "SRIError",
        },
    )


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
        "service": "tax-engine",
        "version": "1.0.0",
        "modules": [
            "iva",
            "retenciones",
            "renta",
            "ice",
            "anexos",
            "sri",
        ],
    }


@app.get(
    "/",
    summary="Root",
    description="Información general del servicio.",
)
async def root() -> Dict:
    return {
        "service": "Tax Engine - Cálculos Tributarios Ecuador",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }
