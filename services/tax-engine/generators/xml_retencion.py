"""Generador de XML para Comprobante de Retención Electrónico.
Esquema SRI: comprobanteRetencion v1.0 / v2.0.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from lxml import etree
from pydantic import BaseModel, Field
from enum import Enum


class TipoIdentificacion(str, Enum):
    RUC = "RUC"
    CEDULA = "CED"
    PASAPORTE = "PAS"
    IDENTIFICACION_EXTERIOR = "IDENTIFICACION_EXTERIOR"


class RegimenFiscal(str, Enum):
    SIMPLIFICADO = "SIMPLIFICADO"
    GENERAL = "GENERAL"


class ImpuestoRetencion(BaseModel):
    """Impuesto retenido en el comprobante."""
    codigo: str  # 1=IVA, 2=IR
    codigo_retencion: str  # Código SRI del impuesto
    base_imponible: Decimal
    porcentaje_retencion: Decimal
    valor_retenido: Decimal
    codigo_documento: str = "01"  # Tipo documento sustento


class EmisorRetencion(BaseModel):
    """Datos del emisor del comprobante de retención."""
    ruc: str
    razon_social: str
    direccion: str = ""
    tipo_contribuyente: str = "PERSONA_NATURAL"
    obligado_contabilidad: bool = True


class ReceptorRetencion(BaseModel):
    """Datos del receptor (sujeto retenido)."""
    identificacion: str
    tipo_identificacion: TipoIdentificacion
    razon_social: str
    direccion: str = ""


class RetencionElectronicaConfig(BaseModel):
    """Configuración del comprobante de retención electrónico."""
    clave_acceso: str = Field(..., pattern=r"^\d{49}$")
    numero_autorizacion: str = ""
    ambiente: int = 2
    tipo_emision: int = 1
    regimen: RegimenFiscal = RegimenFiscal.GENERAL
    moneda: str = "DOLAR"
    serie: str = "001-001"
    numero_secuencial: str = "000000001"
    fecha_emision: str = Field(default_factory=lambda: datetime.utcnow().strftime("%d/%m/%Y"))
    periodo_fiscal: str = Field(default_factory=lambda: datetime.utcnow().strftime("%m/%Y"))


class RetencionXMLGenerator:
    """Generador de XML para comprobantes de retención electrónicos SRI."""

    def generate(
        self,
        emisor: EmisorRetencion,
        receptor: ReceptorRetencion,
        impuestos: List[ImpuestoRetencion],
        config: RetencionElectronicaConfig,
    ) -> str:
        """Genera el XML del comprobante de retención electrónico.
        Returns:
            String XML del comprobante de retención
        """
        nsmap = {
            None: "http://www.sri.gob.ec/comprobanteRetencion",
            "xsd": "http://www.w3.org/2001/XMLSchema-instance",
        }

        root = etree.Element("comprobanteRetencion", nsmap=nsmap)

        # Información general
        info = etree.SubElement(root, "infoTributaria")
        etree.SubElement(info, "ambiente").text = str(config.ambiente)
        etree.SubElement(info, "tipoEmision").text = str(config.tipo_emision)
        etree.SubElement(info, "razonSocial").text = emisor.razon_social
        etree.SubElement(info, "ruc").text = emisor.ruc
        etree.SubElement(info, "claveAcceso").text = config.clave_acceso
        etree.SubElement(info, "codDoc").text = "07"
        etree.SubElement(info, "estab").text = config.serie.split("-")[0]
        etree.SubElement(info, "ptoEmi").text = config.serie.split("-")[1]
        etree.SubElement(info, "secuencial").text = config.numero_secuencial
        etree.SubElement(info, "dirMatriz").text = emisor.direccion
        etree.SubElement(info, "regimenMicroempresas").text = config.regimen.value

        # Información del comprobante de retención
        info_ret = etree.SubElement(root, "infoCompRetencion")
        etree.SubElement(info_ret, "fechaEmision").text = config.fecha_emision
        etree.SubElement(info_ret, "dirEstablecimiento").text = emisor.direccion
        etree.SubElement(info_ret, "obligadoContabilidad").text = "SI" if emisor.obligado_contabilidad else "NO"
        etree.SubElement(info_ret, "tipoIdentificacionSujetoRetenido").text = receptor.tipo_identificacion.value
        etree.SubElement(info_ret, "parteRelVinculado").text = "NO"
        etree.SubElement(info_ret, "periodoFiscal").text = config.periodo_fiscal

        if receptor.tipo_identificacion == TipoIdentificacion.RUC:
            etree.SubElement(info_ret, "rucSujetoRetenido").text = receptor.identificacion
        else:
            etree.SubElement(info_ret, "idSujetoRetenido").text = receptor.identificacion

        etree.SubElement(info_ret, "razonSocialSujetoRetenido").text = receptor.razon_social

        # Impuestos retenidos
        impuestos_elem = etree.SubElement(root, "impuestos")
        for imp in impuestos:
            det = etree.SubElement(impuestos_elem, "impuesto")
            etree.SubElement(det, "codigo").text = imp.codigo
            etree.SubElement(det, "codigoRetencion").text = imp.codigo_retencion
            etree.SubElement(det, "baseImponible").text = f"{imp.base_imponible:.2f}"
            etree.SubElement(det, "porcentajeRetener").text = f"{imp.porcentaje_retencion:.2f}"
            etree.SubElement(det, "valorRetenido").text = f"{imp.valor_retenido:.2f}"
            etree.SubElement(det, "codDocSustento").text = imp.codigo_documento

        return etree.tostring(
            root, pretty_print=True, encoding="UTF-8", xml_declaration=True
        ).decode("utf-8")
