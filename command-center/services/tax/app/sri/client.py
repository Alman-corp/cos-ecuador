import time
import base64
import httpx
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime
import structlog

logger = structlog.get_logger()


class SRIEnvironment(str, Enum):
    TESTING = "TESTING"
    PRODUCTION = "PRODUCTION"


@dataclass
class SRIEndpoints:
    recepcion: str
    autorizacion: str


SRI_WSDLS: Dict[SRIEnvironment, SRIEndpoints] = {
    SRIEnvironment.TESTING: SRIEndpoints(
        recepcion="https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantes?wsdl",
        autorizacion="https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantes?wsdl",
    ),
    SRIEnvironment.PRODUCTION: SRIEndpoints(
        recepcion="https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantes?wsdl",
        autorizacion="https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantes?wsdl",
    ),
}


@dataclass
class SRIResponse:
    success: bool
    status_code: Optional[str] = None
    message: Optional[str] = None
    authorization_number: Optional[str] = None
    authorization_date: Optional[datetime] = None
    raw_response: Optional[Dict] = None
    errors: Optional[List[Dict]] = None
    response_time_ms: int = 0


class SRIClient:
    def __init__(self, environment: SRIEnvironment = SRIEnvironment.TESTING, timeout: int = 30):
        self.environment = environment
        self.endpoints = SRI_WSDLS[environment]
        self.timeout = timeout
        self.http_client = httpx.Client(
            timeout=httpx.Timeout(timeout, connect=10.0),
            verify=True,
            follow_redirects=True,
        )
        self._zeep_recepcion = None
        self._zeep_autorizacion = None

    def _get_recepcion_client(self):
        if self._zeep_recepcion is None:
            from zeep import Client as ZeepClient
            from zeep.transports import Transport
            logger.info("sri.loading_wsdl", endpoint=self.endpoints.recepcion)
            self._zeep_recepcion = ZeepClient(
                wsdl=self.endpoints.recepcion,
                transport=Transport(client=self.http_client, timeout=self.timeout),
            )
        return self._zeep_recepcion

    def _get_autorizacion_client(self):
        if self._zeep_autorizacion is None:
            from zeep import Client as ZeepClient
            from zeep.transports import Transport
            logger.info("sri.loading_wsdl", endpoint=self.endpoints.autorizacion)
            self._zeep_autorizacion = ZeepClient(
                wsdl=self.endpoints.autorizacion,
                transport=Transport(client=self.http_client, timeout=self.timeout),
            )
        return self._zeep_autorizacion

    def validar_comprobante(self, xml_signed_base64: str) -> SRIResponse:
        start_time = time.time()
        try:
            logger.info("sri.sending_receipt", environment=self.environment.value, xml_length=len(xml_signed_base64))
            client = self._get_recepcion_client()
            response = client.service.validarComprobante(xml_signed_base64)
            from zeep.helpers import serialize_object
            serialized = serialize_object(response, dict)
            response_time = int((time.time() - start_time) * 1000)
            estado = serialized.get("estado", "").upper()
            logger.info("sri.receipt_response", estado=estado, response_time_ms=response_time)
            if estado == "RECIBIDA" or estado == "RECIBIDO":
                return SRIResponse(success=True, status_code="RECIBIDA", message="Comprobante recibido", raw_response=serialized, response_time_ms=response_time)
            errors = serialized.get("comprobantes", [])
            error_list = []
            if isinstance(errors, dict) and "comprobante" in errors:
                comps = errors["comprobante"]
                if not isinstance(comps, list): comps = [comps]
                for comp in comps:
                    mensajes = comp.get("mensajes", {}).get("mensaje", [])
                    if not isinstance(mensajes, list): mensajes = [mensajes]
                    for m in mensajes:
                        error_list.append({"identificador": m.get("identificador"), "mensaje": m.get("mensaje"), "informacionAdicional": m.get("informacionAdicional", ""), "tipo": m.get("tipo", "ERROR")})
            return SRIResponse(success=False, status_code="DEVUELTA", message=f"Devuelto con {len(error_list)} errores", errors=error_list, raw_response=serialized, response_time_ms=response_time)
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            logger.exception("sri.receipt_error")
            return SRIResponse(success=False, status_code="ERROR", message=str(e), errors=[{"codigo": "ERROR", "mensaje": str(e)}], response_time_ms=response_time)

    def autorizar_comprobante(self, access_key: str) -> SRIResponse:
        start_time = time.time()
        try:
            logger.info("sri.querying_authorization", access_key=access_key)
            client = self._get_autorizacion_client()
            response = client.service.autorizacionComprobante(access_key)
            from zeep.helpers import serialize_object
            serialized = serialize_object(response, dict)
            response_time = int((time.time() - start_time) * 1000)
            autorizaciones = serialized.get("autorizaciones", {})
            if not autorizaciones:
                return SRIResponse(success=False, status_code="SIN_AUTORIZACION", message="Sin autorizaciones", raw_response=serialized, response_time_ms=response_time)
            auth_list = autorizaciones.get("autorizacion", [])
            if not isinstance(auth_list, list): auth_list = [auth_list]
            if not auth_list:
                return SRIResponse(success=False, status_code="SIN_AUTORIZACION", message="Lista vacia", raw_response=serialized, response_time_ms=response_time)
            auth = auth_list[0]
            estado = auth.get("estado", "").upper()
            if estado == "AUTORIZADO":
                fecha_str = auth.get("fechaAutorizacion")
                auth_date = None
                if isinstance(fecha_str, datetime): auth_date = fecha_str
                elif isinstance(fecha_str, str):
                    try: auth_date = datetime.strptime(fecha_str, "%d/%m/%Y %H:%M:%S")
                    except ValueError:
                        try: auth_date = datetime.fromisoformat(fecha_str)
                        except ValueError: pass
                return SRIResponse(success=True, status_code="AUTORIZADO", message="Autorizado", authorization_number=auth.get("numeroAutorizacion"), authorization_date=auth_date, raw_response=serialized, response_time_ms=response_time)
            errors = []
            mensajes = auth.get("mensajes", {}).get("mensaje", [])
            if not isinstance(mensajes, list): mensajes = [mensajes]
            for m in mensajes:
                if isinstance(m, dict): errors.append({"identificador": m.get("identificador"), "mensaje": m.get("mensaje"), "informacionAdicional": m.get("informacionAdicional", ""), "tipo": m.get("tipo", "ERROR")})
            return SRIResponse(success=False, status_code=estado, message=f"No autorizado: {estado}", errors=errors, raw_response=serialized, response_time_ms=response_time)
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            logger.exception("sri.authorization_error")
            return SRIResponse(success=False, status_code="ERROR", message=str(e), errors=[{"codigo": "ERROR", "mensaje": str(e)}], response_time_ms=response_time)

    def close(self):
        if self.http_client:
            self.http_client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class SRIRucValidator:
    RUC_QUERY_URL = "https://srienlinea.sri.gob.ec/movil-servicios/registroSocial/ruc"
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) COS-Platform/1.0"

    @staticmethod
    async def validate(ruc: str) -> Dict[str, Any]:
        if len(ruc) != 13 or not ruc.isdigit():
            return {"exists": False, "valid": False, "error": "RUC debe tener 13 digitos"}
        provincia = int(ruc[:2])
        if provincia < 1 or provincia > 30 or provincia == 25:
            return {"exists": False, "valid": False, "error": f"Codigo provincia invalido: {provincia}"}
        tercer_digito = int(ruc[2])
        if tercer_digito in (7, 8):
            return {"exists": False, "valid": False, "error": f"Tercer digito {tercer_digito} invalido"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(SRIRucValidator.RUC_QUERY_URL, params={"numeroRuc": ruc}, headers={"User-Agent": SRIRucValidator.USER_AGENT})
                if response.status_code != 200:
                    return {"exists": False, "valid": True, "error": f"SRI respondio HTTP {response.status_code}"}
                data = response.json()
                if not data or "listado" not in data or not data["listado"]:
                    return {"exists": False, "valid": True, "error": "RUC no encontrado en catastro del SRI"}
                contribuyente = data["listado"][0] if isinstance(data["listado"], list) else data["listado"]
                return {"exists": True, "valid": True, "active": contribuyente.get("estado", "").upper() in ["ACTIVO", "ACTIVA"], "ruc": ruc, "razon_social": contribuyente.get("razonSocial"), "nombre_comercial": contribuyente.get("nombreComercial"), "clase_contribuyente": contribuyente.get("claseContribuyente"), "obligado_contabilidad": contribuyente.get("obligado"), "tipo_contribuyente": contribuyente.get("tipoContribuyente"), "actividad_economica": contribuyente.get("actividadEconomica"), "direccion_matriz": contribuyente.get("direccionMatriz"), "fecha_inicio_actividades": contribuyente.get("fechaInicioActividades"), "regimen": contribuyente.get("regimen")}
            except httpx.TimeoutException:
                return {"exists": False, "valid": True, "error": "Timeout consultando SRI"}
            except Exception as e:
                logger.exception("sri.ruc_query_error", ruc=ruc)
                return {"exists": False, "valid": True, "error": str(e)}
