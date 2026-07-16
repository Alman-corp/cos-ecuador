from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import date, datetime
from lxml import etree
import random


class InvoiceDetail(BaseModel):
    description: str
    quantity: Decimal
    unitPrice: Decimal
    discount: Decimal = Field(default=Decimal("0"))
    totalPrice: Decimal
    ivaRate: int
    principalCode: str = "1"


class InvoiceInput(BaseModel):
    environment: int
    emissionDate: date
    documentType: str
    establishment: str
    emissionPoint: str
    sequential: str
    buyerRuc: str
    buyerName: str
    buyerEmail: Optional[str] = None
    buyerAddress: Optional[str] = None
    details: List[InvoiceDetail]
    subtotalZero: Decimal = Field(default=Decimal("0"))
    subtotalNoIva: Decimal = Field(default=Decimal("0"))
    subtotal12: Decimal = Field(default=Decimal("0"))
    subtotal15: Decimal = Field(default=Decimal("0"))
    iva12: Decimal = Field(default=Decimal("0"))
    iva15: Decimal = Field(default=Decimal("0"))
    totalAmount: Decimal = Field(default=Decimal("0"))
    notes: Optional[str] = None


class InvoiceGenerator:
    IVA_CODES = {0: "0", 5: "7", 12: "2", 15: "4"}

    @staticmethod
    def generate_access_key(invoice: InvoiceInput, issuer_ruc: str, environment: int) -> str:
        fecha = invoice.emissionDate.strftime("%d%m%Y")
        serie = invoice.establishment + invoice.emissionPoint
        secuencial = invoice.sequential.zfill(9)
        codigo_numerico = f"{random.randint(10000000, 99999999)}"
        cadena_base = f"{fecha}{issuer_ruc}{invoice.documentType}{serie}{secuencial}{codigo_numerico}{environment}"
        digito = InvoiceGenerator._mod11_check_digit(cadena_base)
        access_key = cadena_base + digito
        if len(access_key) != 49:
            raise ValueError(f"Clave de acceso debe tener 49 digitos, tiene {len(access_key)}")
        return access_key

    @staticmethod
    def _mod11_check_digit(number_str: str) -> str:
        weights = [2, 3, 4, 5, 6, 7]
        suma = sum(int(digit) * weights[i % 6] for i, digit in enumerate(reversed(number_str)))
        residuo = suma % 11
        return "0" if residuo == 0 else ("1" if residuo == 1 else str(11 - residuo))

    @staticmethod
    def generate_xml(invoice: InvoiceInput, issuer_data: dict, access_key: str) -> bytes:
        root = etree.Element("factura", Id="comprobante")
        root.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
        root.set("xsi:noNamespaceSchemaLocation", "factura.xsd")

        info_trib = etree.SubElement(root, "infoTributaria")
        etree.SubElement(info_trib, "ambiente").text = str(invoice.environment)
        etree.SubElement(info_trib, "tipoEmision").text = "1"
        etree.SubElement(info_trib, "razonSocial").text = issuer_data["razon_social"]
        if issuer_data.get("nombre_comercial"):
            etree.SubElement(info_trib, "nombreComercial").text = issuer_data["nombre_comercial"]
        etree.SubElement(info_trib, "ruc").text = issuer_data["ruc"]
        etree.SubElement(info_trib, "claveAcceso").text = access_key
        etree.SubElement(info_trib, "estab").text = invoice.establishment
        etree.SubElement(info_trib, "ptoEmi").text = invoice.emissionPoint
        etree.SubElement(info_trib, "secuencial").text = invoice.sequential
        etree.SubElement(info_trib, "dirMatriz").text = issuer_data.get("direccion_matriz", "")
        if issuer_data.get("contribuyente_especial"):
            etree.SubElement(info_trib, "contribuyenteEspecial").text = issuer_data["contribuyente_especial"]
        etree.SubElement(info_trib, "obligadoContabilidad").text = "SI" if issuer_data.get("obligado_contabilidad", True) else "NO"

        info_factura = etree.SubElement(root, "infoFactura")
        etree.SubElement(info_factura, "fechaEmision").text = invoice.emissionDate.strftime("%d/%m/%Y")
        etree.SubElement(info_factura, "dirEstablecimiento").text = issuer_data.get("direccion_sucursal", issuer_data.get("direccion_matriz", ""))
        etree.SubElement(info_factura, "totalSinImpuestos").text = str(invoice.subtotalZero + invoice.subtotalNoIva + invoice.subtotal12 + invoice.subtotal15)
        etree.SubElement(info_factura, "totalDescuento").text = str(sum(d.discount for d in invoice.details))

        total_con_impuestos = etree.SubElement(info_factura, "totalConImpuestos")
        for base, codigo_pct, valor in [(invoice.subtotal12, "2", invoice.iva12), (invoice.subtotal15, "4", invoice.iva15)]:
            if base > 0:
                total_impuesto = etree.SubElement(total_con_impuestos, "totalImpuesto")
                etree.SubElement(total_impuesto, "codigo").text = "2"
                etree.SubElement(total_impuesto, "codigoPorcentaje").text = codigo_pct
                etree.SubElement(total_impuesto, "baseImponible").text = str(base)
                etree.SubElement(total_impuesto, "valor").text = str(valor)

        etree.SubElement(info_factura, "propina").text = "0.00"
        etree.SubElement(info_factura, "importeTotal").text = str(invoice.totalAmount)
        etree.SubElement(info_factura, "moneda").text = "DOLAR"
        pagos = etree.SubElement(info_factura, "pagos")
        pago = etree.SubElement(pagos, "pago")
        etree.SubElement(pago, "formaPago").text = "20"
        etree.SubElement(pago, "total").text = str(invoice.totalAmount)
        etree.SubElement(pago, "plazo").text = "0"
        etree.SubElement(pago, "unidadTiempo").text = "dias"

        detalles = etree.SubElement(root, "detalles")
        for detail in invoice.details:
            detalle = etree.SubElement(detalles, "detalle")
            etree.SubElement(detalle, "codigoPrincipal").text = detail.principalCode
            etree.SubElement(detalle, "descripcion").text = detail.description
            etree.SubElement(detalle, "cantidad").text = str(detail.quantity)
            etree.SubElement(detalle, "precioUnitario").text = str(detail.unitPrice)
            etree.SubElement(detalle, "descuento").text = str(detail.discount)
            etree.SubElement(detalle, "precioTotalSinImpuesto").text = str(detail.totalPrice)
            impuestos = etree.SubElement(detalle, "impuestos")
            impuesto = etree.SubElement(impuestos, "impuesto")
            etree.SubElement(impuesto, "codigo").text = "2"
            etree.SubElement(impuesto, "codigoPorcentaje").text = InvoiceGenerator.IVA_CODES.get(detail.ivaRate, "0")
            etree.SubElement(impuesto, "tarifa").text = str(detail.ivaRate)
            etree.SubElement(impuesto, "baseImponible").text = str(detail.totalPrice)
            etree.SubElement(impuesto, "valor").text = str((detail.totalPrice * Decimal(str(detail.ivaRate)) / Decimal("100")).quantize(Decimal("0.01")))

        if invoice.buyerEmail or invoice.notes:
            info_adicional = etree.SubElement(root, "infoAdicional")
            if invoice.buyerEmail:
                campo = etree.SubElement(info_adicional, "campoAdicional", nombre="email")
                campo.text = invoice.buyerEmail
            if invoice.notes:
                campo = etree.SubElement(info_adicional, "campoAdicional", nombre="observaciones")
                campo.text = invoice.notes

        xml_bytes = etree.tostring(root, xml_declaration=True, encoding="UTF-8", pretty_print=True)
        return xml_bytes

    @staticmethod
    def compute_totals(invoice: InvoiceInput) -> InvoiceInput:
        subtotal_0 = Decimal("0")
        subtotal_5 = Decimal("0")
        subtotal_12 = Decimal("0")
        subtotal_15 = Decimal("0")
        iva_12 = Decimal("0")
        iva_15 = Decimal("0")
        for d in invoice.details:
            if d.ivaRate == 0: subtotal_0 += d.totalPrice
            elif d.ivaRate == 5: subtotal_5 += d.totalPrice
            elif d.ivaRate == 12: subtotal_12 += d.totalPrice; iva_12 += (d.totalPrice * Decimal("0.12")).quantize(Decimal("0.01"))
            elif d.ivaRate == 15: subtotal_15 += d.totalPrice; iva_15 += (d.totalPrice * Decimal("0.15")).quantize(Decimal("0.01"))
        invoice.subtotalZero = subtotal_0
        invoice.subtotalNoIva = subtotal_5
        invoice.subtotal12 = subtotal_12
        invoice.subtotal15 = subtotal_15
        invoice.iva12 = iva_12
        invoice.iva15 = iva_15
        invoice.totalAmount = subtotal_0 + subtotal_5 + subtotal_12 + subtotal_15 + iva_12 + iva_15
        return invoice
