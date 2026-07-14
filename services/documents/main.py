"""Documents Service FastAPI — Document Management, Templates, OCR, Versioning, and Digital Signatures."""

import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, str(Path(__file__).parent))

from api.documents import router as documents_router

app = FastAPI(
    title="Documents Service — Document & Template Management",
    description="""
    API de gestión documental para el sistema de consultoría ecuatoriano.
    
    **Módulos disponibles:**
    - Documentos (CRUD, versiones, clasificación AI, OCR)
    - Plantillas (gestión y renderizado con variables)
    """,
    version="1.0.0",
    contact={
        "name": "Consultoría Ecuador - Document Services",
        "url": "https://github.com/consultoria-ec/documents-service",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)


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


@app.get("/health", summary="Health Check")
async def health_check() -> dict:
    return {
        "status": "healthy",
        "service": "documents-service",
        "version": "1.0.0",
        "modules": ["documents", "templates"],
    }


@app.get("/", summary="Root")
async def root() -> dict:
    return {
        "service": "Documents Service — Document & Template Management",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/health",
    }
