"""Modelos para peticiones y respuestas SOAP del SRI."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class AmbienteSRI(int, Enum):
    PRODUCCION = 1
    PRUEBAS = 2


class EstadoComprobante(str, Enum):
    RECIBIDO = "RECIBIDO"
    EN_PROCESO = "EN_PROCESO"
    AUTORIZADO = "AUTORIZADO"
    NO_AUTORIZADO = "NO_AUTORIZADO"
    RECHAZADO = "RECHAZADO"
    ANULADO = "ANULADO"
    ERROR = "ERROR"


class TipoComprobante(str, Enum):
    FACTURA = "01"
    NOTA_CREDITO = "04"
    NOTA_DEBITO = "05"
    GUIA_REMISION = "06"
    COMPROBANTE_RETENCION = "07"


class ComprobanteRequest(BaseModel):
    """Solicitud de envío de comprobante al SRI."""
    clave_acceso: str = Field(..., pattern=r"^\d{49}$")
    xml_base64: str
    ambiente: AmbienteSRI = AmbienteSRI.PRUEBAS
    firmado: bool = True


class ComprobanteResponse(BaseModel):
    """Respuesta del SRI tras recepción de comprobante."""
    estado: EstadoComprobante
    numero_comprobante: Optional[str] = None
    clave_acceso: Optional[str] = None
    mensaje: Optional[str] = None
    fecha_recepcion: Optional[datetime] = None
    errores: List[str] = []


class AutorizacionRequest(BaseModel):
    """Solicitud de autorización de comprobante."""
    clave_acceso: str = Field(..., pattern=r"^\d{49}$")
    ambiente: AmbienteSRI = AmbienteSRI.PRUEBAS


class AutorizacionResponse(BaseModel):
    """Respuesta de autorización del SRI."""
    estado: EstadoComprobante
    clave_acceso: str
    numero_autorizacion: Optional[str] = None
    fecha_autorizacion: Optional[datetime] = None
    ambiente: AmbienteSRI
    comprobante: Optional[str] = None
    errores: List[str] = []


class ComprobanteStatus(BaseModel):
    """Estado actual de un comprobante en el SRI."""
    clave_acceso: str
    estado: EstadoComprobante
    mensaje: str
    fecha_consulta: datetime = Field(default_factory=datetime.utcnow)


class MensajeError(BaseModel):
    """Mensaje de error devuelto por el SRI."""
    codigo: str
    mensaje: str
    informacion_adicional: Optional[str] = None
    tipo: str = "ERROR"
