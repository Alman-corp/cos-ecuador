"""API endpoints para Retenciones en la Fuente y Comprobantes de Retención."""

from decimal import Decimal
from fastapi import APIRouter, HTTPException
from typing import Dict, List

from engines.retenciones_engine import (
    RetencionesEngine, RetencionCalculationInput, RetencionCalculationResult,
    RetencionCatalogEntry
)
from generators.xml_retencion import (
    RetencionXMLGenerator, EmisorRetencion, ReceptorRetencion,
    ImpuestoRetencion, RetencionElectronicaConfig, TipoIdentificacion,
)
from sri.firma_ec import FirmaEC

router = APIRouter(prefix="/api/v1/tax/retenciones", tags=["Retenciones"])
engine = RetencionesEngine()
xml_gen = RetencionXMLGenerator()
firma = FirmaEC()


@router.post(
    "/calculate",
    response_model=RetencionCalculationResult,
    summary="Calcular retención en la fuente",
    description="Calcula el valor a retener según el tipo de retención y base imponible. Incluye retención de IVA si aplica.",
)
async def calculate_retencion(input_data: RetencionCalculationInput):
    """Calcula la retención en la fuente del Impuesto a la Renta."""
    try:
        return engine.calculate(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en cálculo de retención: {str(e)}")


@router.post(
    "/generate-comprobante",
    response_model=Dict[str, str],
    summary="Generar comprobante de retención electrónico",
    description="Genera el XML del comprobante de retención electrónico firmado digitalmente.",
)
async def generate_comprobante(
    emisor: EmisorRetencion,
    receptor: ReceptorRetencion,
    impuestos: List[ImpuestoRetencion],
    config: RetencionElectronicaConfig,
):
    """Genera el comprobante de retención electrónico en XML listo para enviar al SRI."""
    try:
        xml_str = xml_gen.generate(emisor, receptor, impuestos, config)
        clave = config.clave_acceso
        return {"xml": xml_str, "clave_acceso": clave, "estado": "GENERADO"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generando comprobante: {str(e)}")


@router.get(
    "/catalog",
    response_model=List[RetencionCatalogEntry],
    summary="Catálogo de retenciones SRI",
    description="Obtiene el catálogo completo de retenciones en la fuente del SRI con códigos, porcentajes y descripciones.",
)
async def get_catalog():
    """Retorna el catálogo SRI de retenciones en la fuente."""
    return engine.get_catalog()


@router.post(
    "/validate",
    response_model=Dict[str, bool],
    summary="Validar comprobante de retención",
    description="Valida que el valor retenido corresponda correctamente al porcentaje legal.",
)
async def validate_retencion(
    base: Decimal,
    porcentaje: Decimal,
    valor_retenido: Decimal,
):
    """Valida que el valor retenido sea correcto según la base y porcentaje."""
    is_valid = engine.validate_retencion(base, porcentaje, valor_retenido)
    return {"is_valid": is_valid}
