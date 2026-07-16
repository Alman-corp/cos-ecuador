from decimal import Decimal
from typing import List
from pydantic import BaseModel
from datetime import date
from lxml import etree
from io import BytesIO
import csv


class ATSComprobante(BaseModel):
    codigo_sustento: str
    tipo_comprobante: str
    numero_comprobante: str
    fecha_comprobante: date
    ruc_proveedor: str
    tipo_identificacion: str = "04"
    razon_social: str
    base_imponible_0: Decimal = Decimal("0")
    base_imponible_iva: Decimal = Decimal("0")
    tarifa_iva: int = 0
    iva_generado: Decimal = Decimal("0")
    iva_retenido: Decimal = Decimal("0")
    base_retencion_rente: Decimal = Decimal("0")
    valor_retencion_rente: Decimal = Decimal("0")
    codigo_retencion_rente: str = ""
    porcentaje_retencion_rente: Decimal = Decimal("0")


class ATSInput(BaseModel):
    tenant_id: str
    ruc_obligado: str
    razon_social: str
    tipo_ambiente: int
    periodo_fiscal: str
    compras: List[ATSComprobante]
    ventas: List[ATSComprobante]
    retenciones_emitidas: List[ATSComprobante] = []


class ATSOutput(BaseModel):
    xml_content: str
    xml_bytes: bytes
    csv_content: str
    resumen: dict
    validaciones: List[str]


class ATSGenerator:
    IVA_TARIFA_CODIGO = {0: "2", 5: "7", 12: "3", 14: "6", 15: "4"}

    @classmethod
    def generate(cls, input_data: ATSInput) -> ATSOutput:
        validaciones = []

        for c in input_data.compras:
            if len(c.ruc_proveedor) != 13:
                validaciones.append(f"RUC inválido en compra {c.numero_comprobante}: {c.ruc_proveedor}")

        nsmap = {None: "http://www.sri.gob.ec/sri-ats", "xsi": "http://www.w3.org/2001/XMLSchema-instance"}
        root = etree.Element("AnexoTransaccionalSimplificado", nsmap=nsmap)

        cabecera = etree.SubElement(root, "Cabecera")
        etree.SubElement(cabecera, "Ruc").text = input_data.ruc_obligado
        etree.SubElement(cabecera, "RazonSocial").text = input_data.razon_social
        etree.SubElement(cabecera, "Anio").text = input_data.periodo_fiscal[:4]
        etree.SubElement(cabecera, "Mes").text = input_data.periodo_fiscal[4:]
        etree.SubElement(cabecera, "numEstab").text = "001"
        etree.SubElement(cabecera, "tipoAmbiente").text = str(input_data.tipo_ambiente)

        compras_elem = etree.SubElement(root, "Compras")
        for c in input_data.compras:
            compra = etree.SubElement(compras_elem, "detalleCompras")
            etree.SubElement(compra, "codSustento").text = c.codigo_sustento
            etree.SubElement(compra, "tpIdProv").text = c.tipo_identificacion
            etree.SubElement(compra, "idProv").text = c.ruc_proveedor
            etree.SubElement(compra, "tipoComprobante").text = c.tipo_comprobante
            etree.SubElement(compra, "numero").text = c.numero_comprobante
            etree.SubElement(compra, "fechaPublicacion").text = c.fecha_comprobante.strftime("%d/%m/%Y")
            etree.SubElement(compra, "fechaRegistroContable").text = c.fecha_comprobante.strftime("%d/%m/%Y")
            etree.SubElement(compra, "establecimiento").text = c.numero_comprobante[:3]
            etree.SubElement(compra, "puntoEmision").text = c.numero_comprobante[4:7]
            etree.SubElement(compra, "secuencial").text = c.numero_comprobante[8:]
            etree.SubElement(compra, "autorizacion").text = ""
            etree.SubElement(compra, "baseNoGraIva").text = str(c.base_imponible_0)
            etree.SubElement(compra, "baseImponible").text = str(c.base_imponible_iva)
            etree.SubElement(compra, "baseNoGravada").text = "0.00"
            etree.SubElement(compra, "baseImponibleGravada").text = str(c.base_imponible_iva)
            etree.SubElement(compra, "montoIva").text = str(c.iva_generado)

            impuestos = etree.SubElement(compra, "impuestos")
            impuesto = etree.SubElement(impuestos, "impuesto")
            etree.SubElement(impuesto, "codigo").text = "2"
            etree.SubElement(impuesto, "codigoPorcentaje").text = cls.IVA_TARIFA_CODIGO.get(c.tarifa_iva, "2")
            etree.SubElement(impuesto, "tarifa").text = str(c.tarifa_iva)
            etree.SubElement(impuesto, "baseImponible").text = str(c.base_imponible_iva)
            etree.SubElement(impuesto, "valor").text = str(c.iva_generado)

            if c.valor_retencion_rente > 0:
                retenciones = etree.SubElement(compra, "retenciones")
                ret = etree.SubElement(retenciones, "detalleRetenciones")
                etree.SubElement(ret, "codigo").text = "1"
                etree.SubElement(ret, "codigoPorcentaje").text = c.codigo_retencion_rente
                etree.SubElement(ret, "baseImponible").text = str(c.base_retencion_rente)
                etree.SubElement(ret, "porcentajeRetener").text = str(c.porcentaje_retencion_rente)
                etree.SubElement(ret, "valorRetenido").text = str(c.valor_retencion_rente)

        ventas_elem = etree.SubElement(root, "Ventas")
        for v in input_data.ventas:
            venta = etree.SubElement(ventas_elem, "detalleVentas")
            etree.SubElement(venta, "tpIdCliente").text = v.tipo_identificacion
            etree.SubElement(venta, "idCliente").text = v.ruc_proveedor
            etree.SubElement(venta, "parteRelVta").text = "NO"
            etree.SubElement(venta, "tipoComprobante").text = v.tipo_comprobante
            etree.SubElement(venta, "numeroComprobantes").text = "1"
            etree.SubElement(venta, "baseNoGraIva").text = str(v.base_imponible_0)
            etree.SubElement(venta, "baseImponible").text = str(v.base_imponible_iva)
            etree.SubElement(venta, "baseNoGravada").text = "0.00"
            etree.SubElement(venta, "valorRetIva").text = str(v.iva_retenido)
            etree.SubElement(venta, "valorRetRenta").text = str(v.valor_retencion_rente)

            impuestos = etree.SubElement(venta, "impuestos")
            impuesto = etree.SubElement(impuestos, "impuesto")
            etree.SubElement(impuesto, "codigo").text = "2"
            etree.SubElement(impuesto, "codigoPorcentaje").text = cls.IVA_TARIFA_CODIGO.get(v.tarifa_iva, "2")
            etree.SubElement(impuesto, "tarifa").text = str(v.tarifa_iva)
            etree.SubElement(impuesto, "baseImponible").text = str(v.base_imponible_iva)
            etree.SubElement(impuesto, "valor").text = str(v.iva_generado)

        xml_bytes = etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8")
        xml_content = xml_bytes.decode("utf-8")
        csv_content = cls._generate_csv(input_data)

        total_compras = sum(c.base_imponible_iva + c.base_imponible_0 for c in input_data.compras)
        total_iva_compras = sum(c.iva_generado for c in input_data.compras)
        total_ventas = sum(v.base_imponible_iva + v.base_imponible_0 for v in input_data.ventas)
        total_iva_ventas = sum(v.iva_generado for v in input_data.ventas)

        resumen = {
            "total_compras": float(total_compras), "total_iva_compras": float(total_iva_compras),
            "total_ventas": float(total_ventas), "total_iva_ventas": float(total_iva_ventas),
            "num_compras": len(input_data.compras), "num_ventas": len(input_data.ventas),
            "num_retenciones": len(input_data.retenciones_emitidas),
            "iva_cobrado_menos_pagado": float(total_iva_ventas - total_iva_compras),
        }

        return ATSOutput(xml_content=xml_content, xml_bytes=xml_bytes, csv_content=csv_content, resumen=resumen, validaciones=validaciones)

    @classmethod
    def _generate_csv(cls, input_data: ATSInput) -> str:
        output = BytesIO()
        writer = csv.writer(output, delimiter="|")
        writer.writerow(["RUC", "RAZON_SOCIAL", "PERIODO", "TIPO_REG", "COD_SUSTENTO", "ID_PROV", "TIPO_COMPROB", "NUMERO", "FECHA", "BASE_0", "BASE_IVA", "TARIFA", "IVA", "RET_RENTA"])
        for c in input_data.compras:
            writer.writerow([input_data.ruc_obligado, input_data.razon_social, input_data.periodo_fiscal, "C", c.codigo_sustento, c.ruc_proveedor, c.tipo_comprobante, c.numero_comprobante, c.fecha_comprobante.strftime("%d/%m/%Y"), c.base_imponible_0, c.base_imponible_iva, c.tarifa_iva, c.iva_generado, c.valor_retencion_rente])
        for v in input_data.ventas:
            writer.writerow([input_data.ruc_obligado, input_data.razon_social, input_data.periodo_fiscal, "V", "", v.ruc_proveedor, v.tipo_comprobante, v.numero_comprobante, v.fecha_comprobante.strftime("%d/%m/%Y"), v.base_imponible_0, v.base_imponible_iva, v.tarifa_iva, v.iva_generado, v.valor_retencion_rente])
        return output.getvalue().decode("utf-8")
