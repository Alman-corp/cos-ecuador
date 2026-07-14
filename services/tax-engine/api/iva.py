"""API endpoints para cálculo de IVA y Formulario 104."""

from decimal import Decimal
from fastapi import APIRouter, HTTPException
from typing import Dict

from engines.iva_engine import (
    IVAEngine, IVACalculationInput, IVACalculationResult, IVARates
)
from engines.formularios import (
    Formulario104, Formulario104Resultado, TipoDeclaracion
)

router = APIRouter(prefix="/api/v1/tax/iva", tags=["IVA"])
engine = IVAEngine()


@router.post(
    "/calculate",
    response_model=IVACalculationResult,
    summary="Calcular IVA mensual",
    description="Calcula el IVA mensual a pagar: IVA Ventas - (IVA Compras + Retenciones + Crédito Anterior)",
)
async def calculate_iva(input_data: IVACalculationInput):
    """Calcula el IVA mensual basado en ventas, compras y retenciones del período."""
    try:
        return engine.calculate(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en cálculo de IVA: {str(e)}")


@router.post(
    "/form104",
    response_model=Formulario104Resultado,
    summary="Generar Formulario 104",
    description="Genera el Formulario 104 de declaración de IVA con todos los casilleros calculados.",
)
async def generate_form104(form: Formulario104):
    """Genera el Formulario 104 completo con cálculos de IVA a pagar."""
    try:
        return engine.generate_form104(form)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generando Formulario 104: {str(e)}")


@router.get(
    "/rates",
    response_model=IVARates,
    summary="Obtener tarifas IVA vigentes",
    description="Retorna las tarifas de IVA vigentes en Ecuador: 0%, 12% y 15% (post-reforma septiembre 2025).",
)
async def get_iva_rates():
    """Obtiene las tarifas de IVA configuradas actualmente."""
    return IVARates()


@router.post(
    "/monthly-summary",
    response_model=Dict,
    summary="Resumen mensual IVA",
    description="Genera un resumen mensual de IVA con ventas, compras y retenciones agregadas.",
)
async def monthly_summary(
    ventas_por_tarifa: Dict[str, Decimal],
    compras_por_tarifa: Dict[str, Decimal],
    retenciones_periodo: Dict[str, Decimal],
    credito_anterior: Decimal = Decimal("0"),
):
    """Genera un resumen mensual de IVA con totales agregados."""
    try:
        return engine.monthly_summary(
            ventas_por_tarifa, compras_por_tarifa,
            retenciones_periodo, credito_anterior
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en resumen mensual: {str(e)}")
