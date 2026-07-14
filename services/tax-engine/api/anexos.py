"""API endpoints para generación y validación de anexos SRI (ATS, XML, XSD)."""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel

from generators.xml_ats import (
    ATSGenerator, ATSConfig, VentasATS, ComprasATS, RetencionATS
)
from generators.xsd_validator import XSDValidator, XSDValidationResult


class ATSGenerateRequest(BaseModel):
    """Solicitud de generación de XML ATS."""
    ruc: str
    razon_social: str
    periodo: str
    anio: int
    mes: int
    ventas: List[VentasATS] = []
    compras: List[ComprasATS] = []
    retenciones: List[RetencionATS] = []


class XMLValidateRequest(BaseModel):
    """Solicitud de validación de XML contra XSD."""
    xml: str
    xsd: Optional[str] = None
    tipo: Optional[str] = None


router = APIRouter(prefix="/api/v1/tax/anexos", tags=["Anexos"])
validator = XSDValidator()


@router.post(
    "/generate-ats",
    summary="Generar XML ATS",
    description="Genera el XML del Anexo Transaccional Simplificado v2.7 para un período fiscal.",
)
async def generate_ats(request: ATSGenerateRequest):
    """Genera el XML del ATS con ventas, compras y retenciones del período."""
    try:
        config = ATSConfig(
            ruc=request.ruc,
            razon_social=request.razon_social,
            periodo=request.periodo,
            anio=request.anio,
            mes=request.mes,
        )
        generator = ATSGenerator(config)
        xml_str = generator.generate(
            ventas=request.ventas,
            compras=request.compras,
            retenciones=request.retenciones,
        )
        return {"xml": xml_str, "periodo": request.periodo, "estado": "GENERADO"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generando ATS: {str(e)}")


@router.post(
    "/validate-ats",
    response_model=XSDValidationResult,
    summary="Validar ATS contra XSD",
    description="Valida un XML de ATS contra el esquema XSD oficial del SRI.",
)
async def validate_ats(xml: str):
    """Valida el XML del ATS contra el esquema XSD v2.7."""
    try:
        return validator.validate_against_sri_schema(xml, "ats")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error validando ATS: {str(e)}")


@router.post(
    "/validate-xml",
    response_model=XSDValidationResult,
    summary="Validar XML contra XSD",
    description="Valida cualquier XML contra un esquema XSD proporcionado.",
)
async def validate_xml(request: XMLValidateRequest):
    """Valida un XML contra un schema XSD o verifica que esté bien formado."""
    try:
        return validator.validate(request.xml, request.xsd)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error validando XML: {str(e)}")
