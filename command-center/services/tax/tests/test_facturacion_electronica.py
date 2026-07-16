import pytest
from decimal import Decimal
from datetime import date
from app.sri.client import SRIClient, SRIEnvironment, SRIRucValidator
from app.sri.invoice_generator import InvoiceInput, InvoiceDetail, InvoiceGenerator


def test_generacion_clave_acceso_49_digitos():
    invoice = InvoiceInput(environment=1, emissionDate=date(2026, 7, 17), documentType="01", establishment="001", emissionPoint="001", sequential="000000001", buyerRuc="1790012345001", buyerName="TEST", details=[])
    access_key = InvoiceGenerator.generate_access_key(invoice, "1790098765001", 1)
    assert len(access_key) == 49
    assert access_key.isdigit()
    assert access_key[:8] == "17072026"
    assert access_key[8:21] == "1790098765001"
    assert access_key[21:23] == "01"
    assert InvoiceGenerator._mod11_check_digit(access_key[:-1]) == access_key[-1]


def test_generacion_xml_factura():
    details = [InvoiceDetail(description="Consultoria", quantity=Decimal("1"), unitPrice=Decimal("1000"), totalPrice=Decimal("1000"), ivaRate=15)]
    invoice = InvoiceInput(environment=1, emissionDate=date(2026, 7, 17), documentType="01", establishment="001", emissionPoint="001", sequential="000000001", buyerRuc="1790012345001", buyerName="EMPRESA TEST", buyerEmail="test@test.com", details=details)
    invoice = InvoiceGenerator.compute_totals(invoice)
    assert invoice.subtotal15 == Decimal("1000")
    assert invoice.iva15 == Decimal("150")
    assert invoice.totalAmount == Decimal("1150")
    access_key = InvoiceGenerator.generate_access_key(invoice, "1790098765001", 1)
    issuer_data = {"ruc": "1790098765001", "razon_social": "CONSULTORA DEMO S.A.", "direccion_matriz": "Quito", "obligado_contabilidad": True}
    xml = InvoiceGenerator.generate_xml(invoice, issuer_data, access_key)
    assert b"<?xml" in xml
    assert b"<factura" in xml
    assert b"<infoTributaria>" in xml
    assert b"<infoFactura>" in xml
    assert b"<detalles>" in xml
    assert access_key.encode() in xml
    assert b"CONSULTORA DEMO S.A." in xml
    assert b"1790012345001" in xml


def test_xml_con_iva_12_y_15():
    details = [
        InvoiceDetail(description="Producto 12%", quantity=Decimal("2"), unitPrice=Decimal("500"), totalPrice=Decimal("1000"), ivaRate=12),
        InvoiceDetail(description="Producto 15%", quantity=Decimal("1"), unitPrice=Decimal("800"), totalPrice=Decimal("800"), ivaRate=15),
    ]
    invoice = InvoiceInput(environment=1, emissionDate=date(2026, 7, 17), documentType="01", establishment="001", emissionPoint="001", sequential="000000002", buyerRuc="1790056789001", buyerName="CLIENTE TEST", details=details)
    invoice = InvoiceGenerator.compute_totals(invoice)
    assert invoice.subtotal12 == Decimal("1000")
    assert invoice.subtotal15 == Decimal("800")
    assert invoice.iva12 == Decimal("120")
    assert invoice.iva15 == Decimal("120")
    assert invoice.totalAmount == Decimal("2040")


@pytest.mark.asyncio
async def test_validacion_ruc_sri():
    result = await SRIRucValidator.validate("1760001560001")
    assert result["valid"] is True
    assert "exists" in result


@pytest.mark.asyncio
async def test_validacion_ruc_invalido():
    result = await SRIRucValidator.validate("123")
    assert result["valid"] is False
    result = await SRIRucValidator.validate("2512345678001")
    assert result["valid"] is False


@pytest.mark.asyncio
async def test_validacion_ruc_provincia_30():
    result = await SRIRucValidator.validate("3012345678001")
    assert result["valid"] is True
