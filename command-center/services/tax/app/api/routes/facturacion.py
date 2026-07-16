from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional, List
from io import BytesIO
from pydantic import BaseModel

from app.sri.client import SRIClient, SRIEnvironment, SRIRucValidator
from app.sri.xml_signer import CertificateManager
from app.sri.invoice_generator import InvoiceInput, InvoiceGenerator, InvoiceDetail
from app.sri.orchestrator import InvoiceOrchestrator
from app.api.deps import get_current_tenant

router = APIRouter()


class RUCValidationRequest(BaseModel):
    ruc: str


class InvoiceRequest(BaseModel):
    client_id: str
    certificate_id: str
    buyer_ruc: str
    buyer_name: str
    buyer_email: Optional[str] = None
    details: List[dict]


class InvoiceResponse(BaseModel):
    invoice_id: str
    access_key: str
    authorization_number: Optional[str] = None
    status: str
    message: str


@router.post("/ruc/validate")
async def validate_ruc(request: RUCValidationRequest, tenant_id: str = Depends(get_current_tenant)):
    result = await SRIRucValidator.validate(request.ruc)
    return result


@router.post("/certificates/upload")
async def upload_certificate(
    alias: str,
    is_default: bool = False,
    file: UploadFile = File(...),
    passphrase: str = "",
    tenant_id: str = Depends(get_current_tenant),
):
    if not file.filename.lower().endswith(('.p12', '.pfx')):
        raise HTTPException(400, "Solo .p12 o .pfx")
    if not passphrase:
        raise HTTPException(400, "Passphrase requerido")
    p12_bytes = await file.read()
    if len(p12_bytes) > 1_000_000:
        raise HTTPException(400, "Archivo demasiado grande (max 1MB)")
    from app.sri.xml_signer import XAdESBESSigner
    try:
        signer = XAdESBESSigner(p12_bytes, passphrase)
        return {
            "alias": alias,
            "serialNumber": signer.cert_data.serial_number,
            "subject": signer.cert_data.subject,
            "issuer": signer.cert_data.issuer,
            "validFrom": signer.cert_data.valid_from.isoformat(),
            "validTo": signer.cert_data.valid_to.isoformat(),
            "status": "ACTIVE",
            "message": "Certificado valido. Almacenamiento en BD requiere implementacion de Vault/S3.",
        }
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/certificates")
async def list_certificates(tenant_id: str = Depends(get_current_tenant)):
    return {"message": "Endpoint requires Prisma integration", "tenant_id": tenant_id, "certificates": []}


@router.post("/invoices/emit", response_model=InvoiceResponse)
async def emit_invoice(
    request: InvoiceRequest,
    background_tasks: BackgroundTasks,
    tenant_id: str = Depends(get_current_tenant),
):
    from datetime import date as dt_date

    details = [
        InvoiceDetail(
            description=d["description"],
            quantity=d["quantity"],
            unitPrice=d["unitPrice"],
            totalPrice=d.get("totalPrice", d["quantity"] * d["unitPrice"]),
            ivaRate=d["ivaRate"],
        ) for d in request.details
    ]

    invoice_input = InvoiceInput(
        environment=1,
        emissionDate=dt_date.today(),
        documentType="01",
        establishment="001",
        emissionPoint="001",
        sequential="000000001",
        buyerRuc=request.buyer_ruc,
        buyerName=request.buyer_name,
        buyerEmail=request.buyer_email,
        details=details,
    )

    invoice_input = InvoiceGenerator.compute_totals(invoice_input)
    issuer_data = {"ruc": "1790000002001", "razon_social": "COS ECUADOR S.A.", "direccion_matriz": "Quito", "obligado_contabilidad": True}
    access_key = InvoiceGenerator.generate_access_key(invoice_input, issuer_data["ruc"], 1)
    xml_unsigned = InvoiceGenerator.generate_xml(invoice_input, issuer_data, access_key)

    return InvoiceResponse(
        invoice_id="pending",
        access_key=access_key,
        status="XML_GENERATED",
        message="XML generado. Para firma y envio, configure certificado digital.",
    )


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, tenant_id: str = Depends(get_current_tenant)):
    raise HTTPException(404, "Database integration required")


@router.get("/invoices/{invoice_id}/xml")
async def download_xml(invoice_id: str, tenant_id: str = Depends(get_current_tenant)):
    raise HTTPException(404, "XML not available")
