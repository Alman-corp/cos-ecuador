"""API endpoints para cálculo del Impuesto a la Renta."""

from fastapi import APIRouter, HTTPException
from engines.renta_engine import (
    RentaEngine, PersonalRentaInput, CorporateRentaInput,
    RentaCalculationResult, AnticipoInput, RentRates
)

router = APIRouter(prefix="/api/v1/tax/renta", tags=["Impuesto a la Renta"])
engine = RentaEngine()


@router.post(
    "/calculate-personal",
    response_model=RentaCalculationResult,
    summary="Calcular IR personas naturales",
    description="Calcula el Impuesto a la Renta para personas naturales usando la tabla progresiva 2025/2026.",
)
async def calculate_personal_renta(input_data: PersonalRentaInput):
    """Calcula el IR de persona natural aplicando tabla progresiva y deducciones de gastos personales."""
    try:
        return engine.calculate_personal(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en cálculo de IR personal: {str(e)}")


@router.post(
    "/calculate-corporate",
    response_model=RentaCalculationResult,
    summary="Calcular IR personas jurídicas",
    description="Calcula el Impuesto a la Renta para sociedades: 28% sobre base imponible.",
)
async def calculate_corporate_renta(input_data: CorporateRentaInput):
    """Calcula el IR de persona jurídica: tasa fija 28% incluye cálculo de anticipo."""
    try:
        return engine.calculate_corporate(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en cálculo de IR corporativo: {str(e)}")


@router.get(
    "/tables",
    response_model=RentRates,
    summary="Tablas de IR vigentes",
    description="Obtiene las tablas de Impuesto a la Renta progresivo para personas naturales y tasa de sociedades.",
)
async def get_renta_tables():
    """Retorna las tablas de IR 2025/2026."""
    return engine.get_tables()


@router.post(
    "/anticipo",
    response_model=dict,
    summary="Calcular anticipo IR",
    description="Calcula el anticipo del Impuesto a la Renta (3% de la base calculada).",
)
async def calculate_anticipo(input_data: AnticipoInput):
    """Calcula el anticipo de IR para el próximo ejercicio fiscal."""
    try:
        return engine.calculate_anticipo(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en cálculo de anticipo: {str(e)}")
