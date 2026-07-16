from fastapi import APIRouter, Depends, HTTPException
from app.calculators.retenciones_calculator import RetencionesCalculator, RetencionInput, RetencionesResult
from app.api.deps import get_current_tenant

router = APIRouter()


@router.post("/calcular", response_model=RetencionesResult)
async def calcular_retenciones(retenciones: list[RetencionInput], tenant_id: str = Depends(get_current_tenant)):
    return RetencionesCalculator.calculate(retenciones)


@router.get("/tasas")
async def obtener_tasas_retencion():
    from app.calculators.constants import RETENCION_RATES_BIENES, RETENCION_RATES_SERVICIOS
    return {
        "bienes": {k.value: float(v) * 100 for k, v in RETENCION_RATES_BIENES.items()},
        "servicios": {k.value: float(v) * 100 for k, v in RETENCION_RATES_SERVICIOS.items()},
    }
