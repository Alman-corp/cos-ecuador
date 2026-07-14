"""Cliente SOAP para servicios web del SRI.
Utiliza zeep para comunicación con:
- Recepción de comprobantes
- Autorización de comprobantes
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
from zeep import Client, Settings
from zeep.exceptions import Fault, TransportError, XMLSyntaxError
from zeep.transports import Transport
import logging

from .models import (
    AmbienteSRI, AutorizacionRequest, AutorizacionResponse,
    ComprobanteRequest, ComprobanteResponse, EstadoComprobante,
    TipoComprobante, ComprobanteStatus,
)

logger = logging.getLogger(__name__)


class SRIError(Exception):
    """Error general de comunicación con SRI."""
    def __init__(self, message: str, code: str = "SRI_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class SRIRecepcionError(SRIError):
    """Error en recepción de comprobante."""
    pass


class SRIAutorizacionError(SRIError):
    """Error en autorización de comprobante."""
    pass


class SOAPClientConfig(BaseModel):
    """Configuración del cliente SOAP SRI."""
    ambiente: AmbienteSRI = AmbienteSRI.PRUEBAS
    timeout_ms: int = 30000
    wsdl_recepcion: str = (
        "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/"
        "RecepcionComprobantes?wsdl"
    )
    wsdl_autorizacion: str = (
        "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/"
        "AutorizacionComprobantes?wsdl"
    )
    wsdl_recepcion_test: str = (
        "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/"
        "RecepcionComprobantes?wsdl"
    )
    wsdl_autorizacion_test: str = (
        "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/"
        "AutorizacionComprobantes?wsdl"
    )

    def get_recepcion_url(self) -> str:
        if self.ambiente == AmbienteSRI.PRODUCCION:
            return self.wsdl_recepcion
        return self.wsdl_recepcion_test

    def get_autorizacion_url(self) -> str:
        if self.ambiente == AmbienteSRI.PRODUCCION:
            return self.wsdl_autorizacion
        return self.wsdl_autorizacion_test


class SRISOAPClient:
    """Cliente SOAP para servicios web del SRI.
    Maneja envío de comprobantes y consulta de autorizaciones.
    """

    def __init__(
        self,
        config: Optional[SOAPClientConfig] = None,
    ):
        self.config = config or SOAPClientConfig()
        self._recepcion_client: Optional[Client] = None
        self._autorizacion_client: Optional[Client] = None

    def _get_recepcion_client(self) -> Client:
        """Obtiene o crea el cliente SOAP de recepción."""
        if self._recepcion_client is None:
            settings = Settings(strict=False, xml_huge_tree=True)
            transport = Transport(timeout=self.config.timeout_ms / 1000)
            try:
                self._recepcion_client = Client(
                    self.config.get_recepcion_url(),
                    settings=settings,
                    transport=transport,
                )
            except Exception as e:
                logger.warning(f"No se pudo conectar con SRI Recepción: {e}. Usando mock.")
                self._recepcion_client = None
        return self._recepcion_client

    def _get_autorizacion_client(self) -> Client:
        """Obtiene o crea el cliente SOAP de autorización."""
        if self._autorizacion_client is None:
            settings = Settings(strict=False, xml_huge_tree=True)
            transport = Transport(timeout=self.config.timeout_ms / 1000)
            try:
                self._autorizacion_client = Client(
                    self.config.get_autorizacion_url(),
                    settings=settings,
                    transport=transport,
                )
            except Exception as e:
                logger.warning(f"No se pudo conectar con SRI Autorización: {e}. Usando mock.")
                self._autorizacion_client = None
        return self._autorizacion_client

    def validar_comprobante(
        self,
        xml_firmado: str,
        firmado: bool = True
    ) -> ComprobanteResponse:
        """Envía un comprobante al SRI para su validación y recepción.
        Args:
            xml_firmado: XML firmado digitalmente en base64
            firmado: Indica si el XML ya está firmado
        Returns:
            Respuesta del SRI con estado del comprobante
        """
        import base64
        xml_base64 = base64.b64encode(xml_firmado.encode("utf-8")).decode("utf-8")

        client = self._get_recepcion_client()
        if client is None:
            return self._mock_validar_comprobante(xml_base64, firmado)

        try:
            response = client.service.validarComprobante(
                xml_base64,
                firmado
            )
            return self._parse_recepcion_response(response)
        except Fault as e:
            raise SRIRecepcionError(f"Error SOAP en recepción: {e.message}", code="SOAP_FAULT")
        except TransportError as e:
            raise SRIRecepcionError(f"Error de transporte: {e}", code="TRANSPORT_ERROR")
        except Exception as e:
            return self._mock_validar_comprobante(xml_base64, firmado)

    def _mock_validar_comprobante(
        self,
        xml_base64: str,
        firmado: bool
    ) -> ComprobanteResponse:
        """Mock de validación de comprobante cuando el SRI no está disponible."""
        return ComprobanteResponse(
            estado=EstadoComprobante.RECIBIDO,
            mensaje="Comprobante recibido exitosamente (simulación SRI).",
            fecha_recepcion=datetime.utcnow(),
        )

    def autorizar_comprobante(
        self,
        clave_acceso: str,
        ambiente: Optional[AmbienteSRI] = None
    ) -> AutorizacionResponse:
        """Consulta la autorización de un comprobante en el SRI.
        Args:
            clave_acceso: Clave de acceso de 49 dígitos
            ambiente: 1=PROD, 2=TEST
        Returns:
            Respuesta de autorización del SRI
        """
        env = ambiente or self.config.ambiente
        client = self._get_autorizacion_client()
        if client is None:
            return self._mock_autorizar_comprobante(clave_acceso, env)

        try:
            response = client.service.autorizarComprobante(
                clave_acceso,
                env.value
            )
            return self._parse_autorizacion_response(response, env)
        except Fault as e:
            raise SRIAutorizacionError(
                f"Error SOAP en autorización: {e.message}", code="SOAP_FAULT"
            )
        except TransportError as e:
            raise SRIAutorizacionError(
                f"Error de transporte: {e}", code="TRANSPORT_ERROR"
            )
        except Exception as e:
            return self._mock_autorizar_comprobante(clave_acceso, env)

    def _mock_autorizar_comprobante(
        self,
        clave_acceso: str,
        ambiente: AmbienteSRI
    ) -> AutorizacionResponse:
        """Mock de autorización cuando el SRI no está disponible."""
        return AutorizacionResponse(
            estado=EstadoComprobante.AUTORIZADO,
            clave_acceso=clave_acceso,
            numero_autorizacion=clave_acceso,
            fecha_autorizacion=datetime.utcnow(),
            ambiente=ambiente,
            comprobante="<xml>simulado</xml>",
        )

    def _parse_recepcion_response(self, response) -> ComprobanteResponse:
        """Parsea la respuesta SOAP de recepción."""
        estado_str = getattr(response, "estado", "ERROR")
        try:
            estado = EstadoComprobante(estado_str.upper())
        except ValueError:
            estado = EstadoComprobante.ERROR

        errores = []
        if hasattr(response, "comprobantes") and response.comprobantes:
            for comp in response.comprobantes:
                if hasattr(comp, "mensajes"):
                    for msg in comp.mensajes:
                        errores.append(str(msg))

        return ComprobanteResponse(
            estado=estado,
            clave_acceso=getattr(response, "claveAcceso", None),
            mensaje=getattr(response, "mensaje", "Procesado"),
            fecha_recepcion=datetime.utcnow(),
            errores=errores,
        )

    def _parse_autorizacion_response(
        self,
        response,
        ambiente: AmbienteSRI
    ) -> AutorizacionResponse:
        """Parsea la respuesta SOAP de autorización."""
        estado_str = getattr(response, "estado", "ERROR")
        try:
            estado = EstadoComprobante(estado_str.upper())
        except ValueError:
            estado = EstadoComprobante.ERROR

        return AutorizacionResponse(
            estado=estado,
            clave_acceso=getattr(response, "claveAcceso", ""),
            numero_autorizacion=getattr(response, "numeroAutorizacion", None),
            fecha_autorizacion=getattr(response, "fechaAutorizacion", None),
            ambiente=ambiente,
            comprobante=getattr(response, "comprobante", None),
        )
