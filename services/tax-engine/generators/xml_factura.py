"""Generador de XML para Factura Electrónica.
Esquema SRI: factura v1.0 / v2.0.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from lxml import etree
from pydantic import BaseModel, Field
from enum import Enum


class TipoIdentificacion(str, Enum):
    RUC = "RUC"
    CEDULA = "CED"
    PASAPORTE = "PAS"


class TarifaIVA(str, Enum):
    IVA_0 = "0"
    IVA_12 = "2"
    IVA_15 = "3"
    NO_OBJETO = "6"
    EXENTO = "7"


class DetalleFactura(BaseModel):
    """Detalle de ítem en factura."""
    codigo_principal: str
    descripcion: str
    cantidad: Decimal
    precio_unitario: Decimal
    descuento: Decimal = Decimal("0")
    tarifa_iva: TarifaIVA = TarifaIVA.IVA_12


class EmisorFactura(BaseModel):
    """Datos del emisor de la factura."""
    ruc: str
    razon_social: str
    nombre_comercial: str = ""
    direccion: str = ""
    contribuyente_especial: str = ""


class ReceptorFactura(BaseModel):
    """Datos del receptor de la factura."""
    identificacion: str
    tipo_identificacion: TipoIdentificacion
    razon_social: str
    direccion: str = ""
    email: str = ""


class FacturaConfig(BaseModel):
    """Configuración de la factura electrónica."""
    clave_acceso: str
    ambiente: int = 2
    tipo_emision: int = 1
    moneda: str = "DOLAR"
    serie: str = "001-001"
    numero_secuencial: str = "000000001"
    fecha_emision: str = Field(default_factory=lambda: datetime.utcnow().strftime("%d/%m/%Y"))
    plazo: str = ""
    forma_pago: str = "01"
    regimen: str = "GENERAL"


class FacturaXMLGenerator:
    """Generador de XML para facturas electrónicas SRI."""

    def generate(
        self,
        emisor: EmisorFactura,
        receptor: ReceptorFactura,
        detalles: List[DetalleFactura],
        config: FacturaConfig,
    ) -> str:
        """Genera el XML de factura electrónica.
        Returns:
            String XML de la factura
        """
        nsmap = {
            None: "http://www.sri.gob.ec/factura",
            "xsd": "http://www.w3.org/2001/XMLSchema-instance",
        }

        root = etree.Element("factura", nsmap=nsmap)

        # Info tributaria
        info = etree.SubElement(root, "infoTributaria")
        etree.SubElement(info, "ambiente").text = str(config.ambiente)
        etree.SubElement(info, "tipoEmision").text = str(config.tipo_emision)
        etree.SubElement(info, "razonSocial").text = emisor.razon_social
        if emisor.nombre_comercial:
            etree.SubElement(info, "nombreComercial").text = emisor.nombre_comercial
        etree.SubElement(info, "ruc").text = emisor.ruc
        etree.SubElement(info, "claveAcceso").text = config.clave_acceso
        etree.SubElement(info, "codDoc").text = "01"
        etree.SubElement(info, "estab").text = config.serie.split("-")[0]
        etree.SubElement(info, "ptoEmi").text = config.serie.split("-")[1]
        etree.SubElement(info, "secuencial").text = config.numero_secuencial
        etree.SubElement(info, "dirMatriz").text = emisor.direccion

        # Info factura
        info_fact = etree.SubElement(root, "infoFactura")
        etree.SubElement(info_fact, "fechaEmision").text = config.fecha_emision
        etree.SubElement(info_fact, "dirEstablecimiento").text = emisor.direccion
        if config.plazo:
            etree.SubElement(info_fact, "plazo").text = config.plazo
        etree.SubElement(info_fact, "obligadoContabilidad").text = "SI"
        etree.SubElement(info_fact, "tipoIdentificacionComprador").text = receptor.tipo_identificacion.value
        etree.SubElement(info_fact, "razonSocialComprador").text = receptor.razon_social
        etree.SubElement(info_fact, "identificacionComprador").text = receptor.identificacion
        if receptor.direccion:
            etree.SubElement(info_fact, "direccionComprador").text = receptor.direccion
        etree.SubElement(info_fact, "totalSinImpuestos").text = "0.00"
        etree.SubElement(info_fact, "totalDescuento").text = "0.00"

        # Total con impuestos
        total_imp = etree.SubElement(info_fact, "totalConImpuestos")
        subtotal_12 = Decimal("0")
        subtotal_0 = Decimal("0")
        iva_12 = Decimal("0")
        total = Decimal("0")

        for d in detalles:
            subtotal_item = d.cantidad * d.precio_unitario - d.descuento
            if d.tarifa_iva == TarifaIVA.IVA_12:
                subtotal_12 += subtotal_item
                iva_12 += subtotal_item * Decimal("12") / Decimal("100")
            else:
                subtotal_0 += subtotal_item
            total += subtotal_item

        total = (subtotal_12 + subtotal_0).quantize(Decimal("0.01"))
        total_iva_12 = iva_12.quantize(Decimal("0.01"))

        if subtotal_12 > 0:
            imp12 = etree.SubElement(total_imp, "totalImpuesto")
            etree.SubElement(imp12, "codigo").text = "2"
            etree.SubElement(imp12, "codigoPorcentaje").text = "2"
            etree.SubElement(imp12, "baseImponible").text = f"{subtotal_12:.2f}"
            etree.SubElement(imp12, "valor").text = f"{total_iva_12:.2f}"

        if subtotal_0 > 0:
            imp0 = etree.SubElement(total_imp, "totalImpuesto")
            etree.SubElement(imp0, "codigo").text = "2"
            etree.SubElement(imp0, "codigoPorcentaje").text = "0"
            etree.SubElement(imp0, "baseImponible").text = f"{subtotal_0:.2f}"
            etree.SubElement(imp0, "valor").text = "0.00"

        etree.SubElement(info_fact, "propina").text = "0.00"
        etree.SubElement(info_fact, "importeTotal").text = f"{total:.2f}"
        etree.SubElement(info_fact, "moneda").text = config.moneda
        etree.SubElement(info_fact, "pagos").text = config.forma_pago

        # Detalles
        detalles_elem = etree.SubElement(root, "detalles")
        for d in detalles:
            det = etree.SubElement(detalles_elem, "detalle")
            etree.SubElement(det, "codigoPrincipal").text = d.codigo_principal
            etree.SubElement(det, "descripcion").text = d.descripcion
            etree.SubElement(det, "cantidad").text = f"{d.cantidad:.2f}"
            etree.SubElement(det, "precioUnitario").text = f"{d.precio_unitario:.2f}"
            desc = d.cantidad * d.precio_unitario - (d.cantidad * d.precio_unitario - d.descuento)
            etree.SubElement(det, "descuento").text = f"{desc:.2f}"
            etree.SubElement(det, "precioTotalSinImpuesto").text = f"{(d.cantidad * d.precio_unitario - d.descuento):.2f}"

            imp_det = etree.SubElement(det, "impuestos")
            imp = etree.SubElement(imp_det, "impuesto")
            etree.SubElement(imp, "codigo").text = "2"
            etree.SubElement(imp, "codigoPorcentaje").text = d.tarifa_iva.value
            base = d.cantidad * d.precio_unitario - d.descuento
            etree.SubElement(imp, "baseImponible").text = f"{base:.2f}"
            if d.tarifa_iva == TarifaIVA.IVA_12:
                etree.SubElement(imp, "valor").text = f"{(base * Decimal('12') / Decimal('100')):.2f}"
            else:
                etree.SubElement(imp, "valor").text = "0.00"

        return etree.tostring(
            root, pretty_print=True, encoding="UTF-8", xml_declaration=True
        ).decode("utf-8")
