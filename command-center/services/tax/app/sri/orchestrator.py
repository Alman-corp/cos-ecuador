import asyncio
import structlog
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass

from .client import SRIClient, SRIEnvironment, SRIResponse
from .xml_signer import XAdESBESSigner, CertificateManager
from .invoice_generator import InvoiceInput, InvoiceGenerator

logger = structlog.get_logger()


@dataclass
class EmissionResult:
    success: bool
    access_key: Optional[str] = None
    authorization_number: Optional[str] = None
    authorization_date: Optional[datetime] = None
    status: str = "UNKNOWN"
    errors: list = None
    attempt_count: int = 0

    def __post_init__(self):
        if self.errors is None: self.errors = []


class InvoiceOrchestrator:
    MAX_RETRY_ATTEMPTS = 7
    RETRY_DELAYS_SECONDS = [30, 60, 120, 300, 900, 1800, 3600]

    def __init__(self, environment: SRIEnvironment, certificate_manager: CertificateManager):
        self.environment = environment
        self.cert_manager = certificate_manager
        self.sri_client = SRIClient(environment)

    async def emit_invoice(self, invoice_input: InvoiceInput, issuer_data: dict, certificate_id: str, tenant_id: str, client_id: str) -> EmissionResult:
        try:
            access_key = InvoiceGenerator.generate_access_key(invoice_input, issuer_data["ruc"], 1 if self.environment == SRIEnvironment.TESTING else 2)
            logger.info("sri.access_key_generated", access_key=access_key)

            xml_unsigned = InvoiceGenerator.generate_xml(invoice_input, issuer_data, access_key)
            logger.info("sri.xml_generated", size_bytes=len(xml_unsigned))

            signer = await self.cert_manager.get_certificate(tenant_id, f"certificates/{tenant_id}/{client_id}/{certificate_id}.p12", f"tax/certificates/{tenant_id}/{client_id}/{certificate_id}")
            xml_firmado = signer.sign_xml(xml_unsigned)
            xml_base64 = __import__('base64').b64encode(xml_firmado).decode('utf-8')
            logger.info("sri.xml_signed", signed_size=len(xml_firmado))

            recepcion_result = await self._send_with_retries(xml_base64, access_key, tenant_id)
            if not recepcion_result.success:
                return EmissionResult(success=False, access_key=access_key, status=recepcion_result.status_code, errors=recepcion_result.errors or [])

            auth_result = await self._wait_for_authorization(access_key, tenant_id)
            if auth_result.success:
                logger.info("sri.invoice_authorized", access_key=access_key, auth_number=auth_result.authorization_number)
                return EmissionResult(success=True, access_key=access_key, authorization_number=auth_result.authorization_number, authorization_date=auth_result.authorization_date, status="AUTHORIZED")
            else:
                return EmissionResult(success=False, access_key=access_key, status=auth_result.status_code, errors=auth_result.errors or [])
        except Exception as e:
            logger.exception("sri.orchestrator_failed")
            return EmissionResult(success=False, status="ORCHESTRATOR_ERROR", errors=[{"error": str(e)}])

    async def _send_with_retries(self, xml_base64: str, access_key: str, tenant_id: str) -> SRIResponse:
        last_response = None
        for attempt in range(self.MAX_RETRY_ATTEMPTS):
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, self.sri_client.validar_comprobante, xml_base64)
                last_response = response
                logger.info("sri.send_attempt", access_key=access_key, attempt=attempt + 1, success=response.success, status=response.status_code)
                if response.success:
                    return response
                if response.status_code == "DEVUELTA":
                    return response
                if attempt < self.MAX_RETRY_ATTEMPTS - 1:
                    await asyncio.sleep(self.RETRY_DELAYS_SECONDS[attempt])
                else:
                    return response
            except Exception as e:
                logger.exception("sri.send_exception", attempt=attempt + 1, access_key=access_key)
                if attempt < self.MAX_RETRY_ATTEMPTS - 1:
                    await asyncio.sleep(self.RETRY_DELAYS_SECONDS[attempt])
                else:
                    return SRIResponse(success=False, status_code="MAX_RETRIES_EXCEEDED", message=f"Max reintentos ({self.MAX_RETRY_ATTEMPTS}) alcanzado", errors=[{"error": str(e)}])
        return last_response

    async def _wait_for_authorization(self, access_key: str, tenant_id: str, max_wait_seconds: int = 300, polling_interval_seconds: int = 5) -> SRIResponse:
        start_time = datetime.now(timezone.utc)
        attempts = 0
        while True:
            elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
            if elapsed > max_wait_seconds:
                return SRIResponse(success=False, status_code="AUTHORIZATION_TIMEOUT", message=f"No autorizado en {max_wait_seconds}s")
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, self.sri_client.autorizar_comprobante, access_key)
                attempts += 1
                logger.info("sri.authorization_poll", access_key=access_key, attempt=attempts, status=response.status_code)
                if response.status_code == "AUTORIZADO":
                    return response
                if response.status_code in ["NO AUTORIZADO", "DEVUELTA"]:
                    return response
                await asyncio.sleep(polling_interval_seconds)
            except Exception as e:
                logger.exception("sri.authorization_poll_error", access_key=access_key)
                await asyncio.sleep(polling_interval_seconds)

    def close(self):
        self.sri_client.close()
