from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.api.routes import iva, retenciones, renta, anexos, cruces
from app.config import settings

logger = structlog.get_logger()

app = FastAPI(
    title="COS Tax Service - Motor Tributario SRI Ecuador",
    version="1.0.0",
    description="Cálculos fiscales, generación de anexos y cruces de información SRI",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(iva.router, prefix="/api/v1/iva", tags=["IVA"])
app.include_router(retenciones.router, prefix="/api/v1/retenciones", tags=["Retenciones"])
app.include_router(renta.router, prefix="/api/v1/renta", tags=["Renta"])
app.include_router(anexos.router, prefix="/api/v1/anexos", tags=["Anexos"])
app.include_router(cruces.router, prefix="/api/v1/cruces", tags=["Cruces"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "tax", "version": "1.0.0"}


@app.on_event("startup")
async def startup():
    logger.info("Tax service iniciado", env=settings.env)
