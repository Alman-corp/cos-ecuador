"""API endpoints para comunicación con SRI (envío y autorización de comprobantes)."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from pydantic import BaseModel, Field

from sri.soap_client import (
    SRISOAPClient, SOAPClientConfig, SRIError,
    SRIRecepcionError, SRIAutorizacionError,
)
from sri.models import (
    ComprobanteResponse, AutorizacionResponse, ComprobanteStatus,
    EstadoComprobante, AmbienteSRI,
)
from sri.auth import SRIAuth, SRIAuthResponse


class SendReceiptRequest(BaseModel):
    """Solicitud de envío de comprobante al SRI."""
    xml_firmado: str
    firmado: bool = True
    ambiente: int = 2


class AuthorizeRequest(BaseModel):
    """Solicitud de autorización de comprobante."""
    clave_acceso: str = Field(..., pattern=r"^\d{49}$")
    ambiente: int = 2


class AuthLoginRequest(BaseModel):
    """Solicitud de autenticación SRI."""
    ruc: str
    razon_social: str
    password_firma: str
    ambiente: int = 2


router = APIRouter(prefix="/api/v1/tax/sri", tags=["SRI"])
soap_client = SRISOAPClient()


@router.post(
    "/send-receipt",
    response_model=ComprobanteResponse,
    summary="Enviar comprobante a SRI",
    description="Envía un comprobante electrónico firmado al SRI para su validación y recepción.",
)
async def send_receipt(request: SendReceiptRequest):
    """Envía el XML firmado al SRI para su procesamiento."""
    try:
        return soap_client.validar_comprobante(
            xml_firmado=request.xml_firmado,
            firmado=request.firmado,
        )
    except (SRIRecepcionError, SRIAutorizacionError) as e:
        raise HTTPException(status_code=502, detail=f"Error de comunicación SRI: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post(
    "/authorize",
    response_model=AutorizacionResponse,
    summary="Autorizar comprobante SRI",
    description="Consulta la autorización de un comprobante electrónico en el SRI usando su clave de acceso.",
)
async def authorize(request: AuthorizeRequest):
    """Consulta la autorización de un comprobante en el SRI."""
    try:
        return soap_client.autorizar_comprobante(
            clave_acceso=request.clave_acceso,
            ambiente=AmbienteSRI(request.ambiente),
        )
    except (SRIRecepcionError, SRIAutorizacionError) as e:
        raise HTTPException(status_code=502, detail=f"Error de comunicación SRI: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get(
    "/status/{clave_acceso}",
    response_model=ComprobanteStatus,
    summary="Estado de comprobante SRI",
    description="Consulta el estado actual de un comprobante en el SRI por su clave de acceso.",
)
async def get_status(clave_acceso: str):
    """Obtiene el estado actual de un comprobante en el SRI."""
    try:
        result = soap_client.autorizar_comprobante(
            clave_acceso=clave_acceso,
        )
        return ComprobanteStatus(
            clave_acceso=clave_acceso,
            estado=result.estado,
            mensaje=f"Comprobante en estado: {result.estado.value}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando estado: {str(e)}")


@router.post(
    "/auth/login",
    response_model=SRIAuthResponse,
    summary="Autenticar en SRI",
    description="Autentica contra el SRI usando RUC y contraseña de firma electrónica.",
)
async def auth_login(request: AuthLoginRequest):
    """Autentica en el SRI y obtiene un token de acceso."""
    try:
        auth = SRIAuth(request.ruc, request.razon_social)
        return auth.authenticate(request.password_firma, request.ambiente)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Error de autenticación: {str(e)}")
