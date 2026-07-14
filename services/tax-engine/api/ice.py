"""API endpoints para cálculo del ICE (Impuesto a los Consumos Especiales)."""

from fastapi import APIRouter, HTTPException
from engines.ice_engine import (
    ICEEngine, ICECalculationInput, ICECalculationResult, ICERates
)

router = APIRouter(prefix="/api/v1/tax/ice", tags=["ICE"])
engine = ICEEngine()


@router.post(
    "/calculate",
    response_model=ICECalculationResult,
    summary="Calcular ICE",
    description="Calcula el ICE total (específico + ad-valorem) para una categoría de producto.",
)
async def calculate_ice(input_data: ICECalculationInput):
    """Calcula el ICE para un producto: ICE = ICE Específico + ICE Ad-Valorem."""
    try:
        return engine.calculate(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en cálculo de ICE: {str(e)}")


@router.get(
    "/rates",
    response_model=ICERates,
    summary="Tarifas ICE por producto",
    description="Obtiene todas las tarifas ICE vigentes categorizadas por tipo de producto.",
)
async def get_ice_rates():
    """Retorna el catálogo de tarifas ICE por categoría de producto."""
    return engine.get_rates()
