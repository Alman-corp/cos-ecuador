"""Generador de XML para ATS (Anexo Transaccional Simplificado) v2.7.
Cumple con el esquema SRI para declaración de ventas, compras y retenciones.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Dict, List, Optional
from lxml import etree
from pydantic import BaseModel, Field
from enum import Enum


class TipoIdentificacion(str, Enum):
    RUC = "RUC"
    CEDULA = "CED"
    PASAPORTE = "PAS"
    IDENTIFICACION_EXTERIOR = "IDENTIFICACION_EXTERIOR"


class TipoComprobanteATS(str, Enum):
    FACTURA = "01"
    NOTA_CREDITO = "04"
    NOTA_DEBITO = "05"
    GUIA_REMISION = "06"
    COMPROBANTE_RETENCION = "07"


class VentasATS(BaseModel):
    """Registro de venta para ATS."""
    codigo_comprobante: str
    tipo_comprobante: TipoComprobanteATS
    numero_serie: str
    numero_documento: str
    fecha_emision: str
    identificacion_comprador: str
    tipo_identificacion: TipoIdentificacion
    base_imponible: Decimal
    base_imponible_no_iva: Decimal = Decimal("0")
    monto_iva: Decimal
    monto_ice: Decimal = Decimal("0")
    forma_pago: str = "01"


class ComprasATS(BaseModel):
    """Registro de compra para ATS."""
    codigo_comprobante: str
    tipo_comprobante: TipoComprobanteATS
    numero_serie: str
    numero_documento: str
    fecha_emision: str
    identificacion_proveedor: str
    tipo_identificacion: TipoIdentificacion
    base_imponible: Decimal
    base_imponible_no_iva: Decimal = Decimal("0")
    monto_iva: Decimal
    monto_ice: Decimal = Decimal("0")
    retencion_iva: Decimal = Decimal("0")
    retencion_fuente: Decimal = Decimal("0")


class RetencionATS(BaseModel):
    """Registro de retención para ATS."""
    codigo_comprobante: str = "07"
    tipo_comprobante: TipoComprobanteATS = TipoComprobanteATS.COMPROBANTE_RETENCION
    numero_serie: str
    numero_documento: str
    fecha_emision: str
    identificacion_retenido: str
    tipo_identificacion: TipoIdentificacion
    base_imponible: Decimal
    porcentaje_retencion: Decimal
    codigo_retencion: str
    valor_retenido: Decimal


class ATSConfig(BaseModel):
    """Configuración del ATS."""
    ruc: str
    razon_social: str
    periodo: str  # MM-YYYY
    anio: int
    mes: int


class ATSGenerator:
    """Generador de XML ATS v2.7 compatible con SRI Ecuador."""

    NSMAP = {
        None: "http://www.sri.gob.ec/ats",
        "xsd": "http://www.w3.org/2001/XMLSchema",
    }

    def __init__(self, config: ATSConfig):
        self.config = config

    def _build_header(self, root: etree.Element):
        """Construye la cabecera del ATS."""
        etree.SubElement(root, "ruc").text = self.config.ruc
        etree.SubElement(root, "razonSocial").text = self.config.razon_social
        etree.SubElement(root, "anio").text = str(self.config.anio)
        etree.SubElement(root, "mes").text = str(self.config.mes).zfill(2)
        etree.SubElement(root, "periodo").text = self.config.periodo
        etree.SubElement(root, "tipoIdentificacion").text = "RUC"
        etree.SubElement(root, "fechaGeneracion").text = datetime.utcnow().strftime("%d/%m/%Y")

    def _add_detalle_ventas(
        self,
        root: etree.Element,
        ventas: List[VentasATS]
    ):
        """Añade la sección de ventas al ATS."""
        if not ventas:
            return
        ventas_elem = etree.SubElement(root, "ventas")
        for v in ventas:
            det = etree.SubElement(ventas_elem, "detalleVentas")
            etree.SubElement(det, "codigoComprobante").text = v.codigo_comprobante
            etree.SubElement(det, "tipoComprobante").text = v.tipo_comprobante.value
            etree.SubElement(det, "numeroSerie").text = v.numero_serie
            etree.SubElement(det, "numeroDocumento").text = v.numero_documento
            etree.SubElement(det, "fechaEmision").text = v.fecha_emision
            etree.SubElement(det, "identificacionComprador").text = v.identificacion_comprador
            etree.SubElement(det, "tipoIdentificacion").text = v.tipo_identificacion.value
            base = etree.SubElement(det, "baseImponible")
            base.text = f"{v.base_imponible:.2f}"
            base.set("tarifa", "12")
            if v.base_imponible_no_iva > Decimal("0"):
                base0 = etree.SubElement(det, "baseImponible")
                base0.text = f"{v.base_imponible_no_iva:.2f}"
                base0.set("tarifa", "0")
            etree.SubElement(det, "montoIVA").text = f"{v.monto_iva:.2f}"
            if v.monto_ice > Decimal("0"):
                etree.SubElement(det, "montoICE").text = f"{v.monto_ice:.2f}"
            etree.SubElement(det, "formaPago").text = v.forma_pago

    def _add_detalle_compras(
        self,
        root: etree.Element,
        compras: List[ComprasATS]
    ):
        """Añade la sección de compras al ATS."""
        if not compras:
            return
        compras_elem = etree.SubElement(root, "compras")
        for c in compras:
            det = etree.SubElement(compras_elem, "detalleCompras")
            etree.SubElement(det, "codigoComprobante").text = c.codigo_comprobante
            etree.SubElement(det, "tipoComprobante").text = c.tipo_comprobante.value
            etree.SubElement(det, "numeroSerie").text = c.numero_serie
            etree.SubElement(det, "numeroDocumento").text = c.numero_documento
            etree.SubElement(det, "fechaEmision").text = c.fecha_emision
            etree.SubElement(det, "identificacionProveedor").text = c.identificacion_proveedor
            etree.SubElement(det, "tipoIdentificacion").text = c.tipo_identificacion.value
            base = etree.SubElement(det, "baseImponible")
            base.text = f"{c.base_imponible:.2f}"
            base.set("tarifa", "12")
            if c.base_imponible_no_iva > Decimal("0"):
                base0 = etree.SubElement(det, "baseImponible")
                base0.text = f"{c.base_imponible_no_iva:.2f}"
                base0.set("tarifa", "0")
            etree.SubElement(det, "montoIVA").text = f"{c.monto_iva:.2f}"
            if c.monto_ice > Decimal("0"):
                etree.SubElement(det, "montoICE").text = f"{c.monto_ice:.2f}"
            if c.retencion_iva > Decimal("0"):
                etree.SubElement(det, "retencionIVA").text = f"{c.retencion_iva:.2f}"
            if c.retencion_fuente > Decimal("0"):
                etree.SubElement(det, "retencionFuente").text = f"{c.retencion_fuente:.2f}"

    def _add_retenciones(
        self,
        root: etree.Element,
        retenciones: List[RetencionATS]
    ):
        """Añade la sección de retenciones al ATS."""
        if not retenciones:
            return
        ret_elem = etree.SubElement(root, "retenciones")
        for r in retenciones:
            det = etree.SubElement(ret_elem, "detalleRetenciones")
            etree.SubElement(det, "codigoComprobante").text = r.codigo_comprobante
            etree.SubElement(det, "tipoComprobante").text = r.tipo_comprobante.value
            etree.SubElement(det, "numeroSerie").text = r.numero_serie
            etree.SubElement(det, "numeroDocumento").text = r.numero_documento
            etree.SubElement(det, "fechaEmision").text = r.fecha_emision
            etree.SubElement(det, "identificacionRetenido").text = r.identificacion_retenido
            etree.SubElement(det, "tipoIdentificacion").text = r.tipo_identificacion.value
            etree.SubElement(det, "baseImponible").text = f"{r.base_imponible:.2f}"
            etree.SubElement(det, "porcentajeRetencion").text = f"{r.porcentaje_retencion:.2f}"
            etree.SubElement(det, "codigoRetencion").text = r.codigo_retencion
            etree.SubElement(det, "valorRetenido").text = f"{r.valor_retenido:.2f}"

    def generate(
        self,
        ventas: Optional[List[VentasATS]] = None,
        compras: Optional[List[ComprasATS]] = None,
        retenciones: Optional[List[RetencionATS]] = None,
    ) -> str:
        """Genera el XML ATS completo.
        Returns:
            String XML del ATS
        """
        root = etree.Element("ATS", nsmap=self.NSMAP)
        self._build_header(root)
        self._add_detalle_ventas(root, ventas or [])
        self._add_detalle_compras(root, compras or [])
        self._add_retenciones(root, retenciones or [])
        return etree.tostring(
            root, pretty_print=True, encoding="UTF-8", xml_declaration=True
        ).decode("utf-8")
