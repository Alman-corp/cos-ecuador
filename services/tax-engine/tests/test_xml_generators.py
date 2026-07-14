import pytest
from decimal import Decimal
from lxml import etree
from generators.xml_ats import (
    ATSGenerator, ATSConfig, VentasATS, ComprasATS, RetencionATS,
    TipoComprobanteATS, TipoIdentificacion,
)
from generators.xml_retencion import (
    RetencionXMLGenerator, EmisorRetencion, ReceptorRetencion,
    ImpuestoRetencion, RetencionElectronicaConfig, TipoIdentificacion as RetTipoId,
)
from generators.xml_factura import (
    FacturaXMLGenerator, EmisorFactura, ReceptorFactura,
    DetalleFactura, FacturaConfig, TarifaIVA,
    TipoIdentificacion as FacturaTipoId,
)
from generators.xsd_validator import XSDValidator


NS_ATS = "http://www.sri.gob.ec/ats"
NS_RETENCION = "http://www.sri.gob.ec/comprobanteRetencion"
NS_FACTURA = "http://www.sri.gob.ec/factura"


RUC_VALIDO = "1799999999001"
CLAVE_ACCESO = "1234567890123456789012345678901234567890123456789"


def parse_xml(xml_str: str):
    return etree.fromstring(xml_str.encode("utf-8"))


class TestATSGenerator:
    """Pruebas del generador de XML ATS."""

    def test_ats_ventas_structure(self, sample_ats_config):
        gen = ATSGenerator(sample_ats_config)
        ventas = [
            VentasATS(
                codigo_comprobante="01",
                tipo_comprobante=TipoComprobanteATS.FACTURA,
                numero_serie="001-001",
                numero_documento="000000001",
                fecha_emision="15/01/2026",
                identificacion_comprador="1712345678001",
                tipo_identificacion=TipoIdentificacion.RUC,
                base_imponible=Decimal("1000"),
                monto_iva=Decimal("120"),
            )
        ]
        xml = gen.generate(ventas=ventas)
        root = parse_xml(xml)
        assert root.tag == f"{{{NS_ATS}}}ATS"

    def test_ats_has_periodo(self, sample_ats_config):
        gen = ATSGenerator(sample_ats_config)
        xml = gen.generate()
        root = parse_xml(xml)
        assert root.find(f"{{{NS_ATS}}}anio") is not None
        assert root.find(f"{{{NS_ATS}}}mes") is not None
        assert root.find(f"{{{NS_ATS}}}periodo") is not None

    def test_ats_has_ruc(self, sample_ats_config):
        gen = ATSGenerator(sample_ats_config)
        xml = gen.generate()
        root = parse_xml(xml)
        ruc_elem = root.find(f"{{{NS_ATS}}}ruc")
        assert ruc_elem is not None
        assert ruc_elem.text == RUC_VALIDO

    def test_ats_ventas_detalle(self, sample_ats_config, sample_ventas_data):
        gen = ATSGenerator(sample_ats_config)
        xml = gen.generate(ventas=sample_ventas_data)
        root = parse_xml(xml)
        ventas_elem = root.find(f"{{{NS_ATS}}}ventas")
        assert ventas_elem is not None
        detalles = ventas_elem.findall(f"{{{NS_ATS}}}detalleVentas")
        assert len(detalles) == 2

    def test_ats_ventas_tiene_base_monto(self, sample_ats_config):
        gen = ATSGenerator(sample_ats_config)
        ventas = [
            VentasATS(
                codigo_comprobante="01",
                tipo_comprobante=TipoComprobanteATS.FACTURA,
                numero_serie="001-001",
                numero_documento="000000001",
                fecha_emision="15/01/2026",
                identificacion_comprador="1712345678001",
                tipo_identificacion=TipoIdentificacion.RUC,
                base_imponible=Decimal("1000"),
                monto_iva=Decimal("120"),
            )
        ]
        xml = gen.generate(ventas=ventas)
        root = parse_xml(xml)
        det = root.find(f"{{{NS_ATS}}}ventas/{{{NS_ATS}}}detalleVentas")
        assert det.find(f"{{{NS_ATS}}}baseImponible") is not None
        assert det.find(f"{{{NS_ATS}}}montoIVA") is not None
        assert det.find(f"{{{NS_ATS}}}baseImponible").text == "1000.00"

    def test_ats_compras_structure(self, sample_ats_config, sample_compras_data):
        gen = ATSGenerator(sample_ats_config)
        xml = gen.generate(compras=sample_compras_data)
        root = parse_xml(xml)
        compras_elem = root.find(f"{{{NS_ATS}}}compras")
        assert compras_elem is not None
        detalles = compras_elem.findall(f"{{{NS_ATS}}}detalleCompras")
        assert len(detalles) == 1

    def test_ats_compras_tiene_retenciones(self, sample_ats_config):
        gen = ATSGenerator(sample_ats_config)
        compras = [
            ComprasATS(
                codigo_comprobante="01",
                tipo_comprobante=TipoComprobanteATS.FACTURA,
                numero_serie="001-001",
                numero_documento="000000100",
                fecha_emision="10/01/2026",
                identificacion_proveedor=RUC_VALIDO,
                tipo_identificacion=TipoIdentificacion.RUC,
                base_imponible=Decimal("2000"),
                monto_iva=Decimal("240"),
                retencion_iva=Decimal("72"),
                retencion_fuente=Decimal("20"),
            )
        ]
        xml = gen.generate(compras=compras)
        root = parse_xml(xml)
        det = root.find(f"{{{NS_ATS}}}compras/{{{NS_ATS}}}detalleCompras")
        assert det.find(f"{{{NS_ATS}}}retencionIVA") is not None
        assert det.find(f"{{{NS_ATS}}}retencionIVA").text == "72.00"
        assert det.find(f"{{{NS_ATS}}}retencionFuente") is not None

    def test_ats_retenciones_structure(self, sample_ats_config, sample_retencion_data):
        gen = ATSGenerator(sample_ats_config)
        xml = gen.generate(retenciones=sample_retencion_data)
        root = parse_xml(xml)
        ret_elem = root.find(f"{{{NS_ATS}}}retenciones")
        assert ret_elem is not None
        detalles = ret_elem.findall(f"{{{NS_ATS}}}detalleRetenciones")
        assert len(detalles) == 1

    def test_ats_retenciones_detalle(self, sample_ats_config):
        gen = ATSGenerator(sample_ats_config)
        retenciones = [
            RetencionATS(
                codigo_comprobante="07",
                tipo_comprobante=TipoComprobanteATS.COMPROBANTE_RETENCION,
                numero_serie="001-001",
                numero_documento="000000050",
                fecha_emision="15/01/2026",
                identificacion_retenido="1712345678001",
                tipo_identificacion=TipoIdentificacion.RUC,
                base_imponible=Decimal("1000"),
                porcentaje_retencion=Decimal("2"),
                codigo_retencion="304",
                valor_retenido=Decimal("20"),
            )
        ]
        xml = gen.generate(retenciones=retenciones)
        root = parse_xml(xml)
        det = root.find(f"{{{NS_ATS}}}retenciones/{{{NS_ATS}}}detalleRetenciones")
        assert det.find(f"{{{NS_ATS}}}codigoRetencion") is not None
        assert det.find(f"{{{NS_ATS}}}codigoRetencion").text == "304"
        assert det.find(f"{{{NS_ATS}}}valorRetenido").text == "20.00"


class TestRetencionXML:
    """Pruebas del generador de XML de comprobante de retención."""

    def test_retencion_xml_structure(self):
        gen = RetencionXMLGenerator()
        xml = gen.generate(
            emisor=EmisorRetencion(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorRetencion(
                identificacion="1712345678001",
                tipo_identificacion=RetTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            impuestos=[
                ImpuestoRetencion(
                    codigo="2", codigo_retencion="304",
                    base_imponible=Decimal("1000"),
                    porcentaje_retencion=Decimal("1"),
                    valor_retenido=Decimal("10"),
                )
            ],
            config=RetencionElectronicaConfig(clave_acceso=CLAVE_ACCESO),
        )
        root = parse_xml(xml)
        assert root.tag == f"{{{NS_RETENCION}}}comprobanteRetencion"

    def test_retencion_xml_info_tributaria(self):
        gen = RetencionXMLGenerator()
        xml = gen.generate(
            emisor=EmisorRetencion(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorRetencion(
                identificacion="1712345678001",
                tipo_identificacion=RetTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            impuestos=[],
            config=RetencionElectronicaConfig(clave_acceso=CLAVE_ACCESO),
        )
        root = parse_xml(xml)
        info = root.find(f"{{{NS_RETENCION}}}infoTributaria")
        assert info is not None
        assert info.find(f"{{{NS_RETENCION}}}ruc").text == RUC_VALIDO
        assert info.find(f"{{{NS_RETENCION}}}codDoc").text == "07"

    def test_retencion_xml_has_taxes(self):
        gen = RetencionXMLGenerator()
        xml = gen.generate(
            emisor=EmisorRetencion(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorRetencion(
                identificacion="1712345678001",
                tipo_identificacion=RetTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            impuestos=[
                ImpuestoRetencion(
                    codigo="2", codigo_retencion="304",
                    base_imponible=Decimal("1000"),
                    porcentaje_retencion=Decimal("1"),
                    valor_retenido=Decimal("10"),
                ),
                ImpuestoRetencion(
                    codigo="1", codigo_retencion="332",
                    base_imponible=Decimal("1000"),
                    porcentaje_retencion=Decimal("30"),
                    valor_retenido=Decimal("36"),
                ),
            ],
            config=RetencionElectronicaConfig(clave_acceso=CLAVE_ACCESO),
        )
        root = parse_xml(xml)
        impuestos_elem = root.find(f"{{{NS_RETENCION}}}impuestos")
        assert impuestos_elem is not None
        impuestos = impuestos_elem.findall(f"{{{NS_RETENCION}}}impuesto")
        assert len(impuestos) == 2

    def test_retencion_xml_periodo_fiscal(self):
        gen = RetencionXMLGenerator()
        xml = gen.generate(
            emisor=EmisorRetencion(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorRetencion(
                identificacion="1712345678001",
                tipo_identificacion=RetTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            impuestos=[],
            config=RetencionElectronicaConfig(clave_acceso=CLAVE_ACCESO),
        )
        root = parse_xml(xml)
        info_ret = root.find(f"{{{NS_RETENCION}}}infoCompRetencion")
        assert info_ret is not None
        assert info_ret.find(f"{{{NS_RETENCION}}}periodoFiscal") is not None


class TestFacturaXML:
    """Pruebas del generador de XML de factura electrónica."""

    def test_factura_xml_structure(self):
        gen = FacturaXMLGenerator()
        xml = gen.generate(
            emisor=EmisorFactura(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorFactura(
                identificacion="1712345678001",
                tipo_identificacion=FacturaTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            detalles=[
                DetalleFactura(
                    codigo_principal="001",
                    descripcion="Producto 1",
                    cantidad=Decimal("2"),
                    precio_unitario=Decimal("100"),
                )
            ],
            config=FacturaConfig(clave_acceso=CLAVE_ACCESO),
        )
        root = parse_xml(xml)
        assert root.tag == f"{{{NS_FACTURA}}}factura"

    def test_factura_xml_info_tributaria(self):
        gen = FacturaXMLGenerator()
        xml = gen.generate(
            emisor=EmisorFactura(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorFactura(
                identificacion="1712345678001",
                tipo_identificacion=FacturaTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            detalles=[],
            config=FacturaConfig(clave_acceso=CLAVE_ACCESO),
        )
        root = parse_xml(xml)
        info = root.find(f"{{{NS_FACTURA}}}infoTributaria")
        assert info is not None
        assert info.find(f"{{{NS_FACTURA}}}ruc").text == RUC_VALIDO
        assert info.find(f"{{{NS_FACTURA}}}codDoc").text == "01"

    def test_factura_xml_has_detalles(self):
        gen = FacturaXMLGenerator()
        xml = gen.generate(
            emisor=EmisorFactura(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorFactura(
                identificacion="1712345678001",
                tipo_identificacion=FacturaTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            detalles=[
                DetalleFactura(
                    codigo_principal="001",
                    descripcion="Producto 1",
                    cantidad=Decimal("2"),
                    precio_unitario=Decimal("100"),
                    tarifa_iva=TarifaIVA.IVA_12,
                ),
                DetalleFactura(
                    codigo_principal="002",
                    descripcion="Producto 2",
                    cantidad=Decimal("1"),
                    precio_unitario=Decimal("50"),
                    tarifa_iva=TarifaIVA.IVA_0,
                ),
            ],
            config=FacturaConfig(clave_acceso=CLAVE_ACCESO),
        )
        root = parse_xml(xml)
        detalles_elem = root.find(f"{{{NS_FACTURA}}}detalles")
        assert detalles_elem is not None
        detalles = detalles_elem.findall(f"{{{NS_FACTURA}}}detalle")
        assert len(detalles) == 2

    def test_factura_xml_total_con_impuestos(self):
        gen = FacturaXMLGenerator()
        xml = gen.generate(
            emisor=EmisorFactura(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorFactura(
                identificacion="1712345678001",
                tipo_identificacion=FacturaTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            detalles=[
                DetalleFactura(
                    codigo_principal="001",
                    descripcion="Producto 1",
                    cantidad=Decimal("2"),
                    precio_unitario=Decimal("100"),
                    tarifa_iva=TarifaIVA.IVA_12,
                ),
            ],
            config=FacturaConfig(clave_acceso=CLAVE_ACCESO),
        )
        root = parse_xml(xml)
        info_fact = root.find(f"{{{NS_FACTURA}}}infoFactura")
        total_imp = info_fact.find(f"{{{NS_FACTURA}}}totalConImpuestos")
        assert total_imp is not None
        imp = total_imp.find(f"{{{NS_FACTURA}}}totalImpuesto")
        assert imp is not None
        assert imp.find(f"{{{NS_FACTURA}}}codigo").text == "2"
        assert imp.find(f"{{{NS_FACTURA}}}baseImponible").text == "200.00"
        assert imp.find(f"{{{NS_FACTURA}}}valor").text == "24.00"


class TestXSDValidator:
    """Pruebas del validador XSD."""

    def test_xsd_validation_valid_xml(self):
        validator = XSDValidator()
        valid_xml = "<root><item>test</item></root>"
        result = validator.validate(valid_xml)
        assert result.is_valid is True

    def test_xsd_validation_invalid_xml(self):
        validator = XSDValidator()
        result = validator.validate("not xml at all")
        assert result.is_valid is False
        assert len(result.errors) > 0

    def test_xsd_validation_empty_string(self):
        validator = XSDValidator()
        result = validator.validate("")
        assert result.is_valid is False

    def test_xsd_validation_against_sri_schema_factura(self):
        gen = FacturaXMLGenerator()
        xml = gen.generate(
            emisor=EmisorFactura(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorFactura(
                identificacion="1712345678001",
                tipo_identificacion=FacturaTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            detalles=[],
            config=FacturaConfig(clave_acceso=CLAVE_ACCESO),
        )
        validator = XSDValidator()
        result = validator.validate_against_sri_schema(xml, "factura")
        assert result.is_valid is True

    def test_xsd_validation_against_sri_schema_retencion(self):
        gen = RetencionXMLGenerator()
        xml = gen.generate(
            emisor=EmisorRetencion(ruc=RUC_VALIDO, razon_social="EMISOR S.A."),
            receptor=ReceptorRetencion(
                identificacion="1712345678001",
                tipo_identificacion=RetTipoId.RUC,
                razon_social="RECEPTOR S.A.",
            ),
            impuestos=[],
            config=RetencionElectronicaConfig(clave_acceso=CLAVE_ACCESO),
        )
        validator = XSDValidator()
        result = validator.validate_against_sri_schema(xml, "retencion")
        assert result.is_valid is True

    def test_xsd_validation_against_sri_schema_ats(self, sample_ats_config):
        gen = ATSGenerator(sample_ats_config)
        xml = gen.generate()
        validator = XSDValidator()
        result = validator.validate_against_sri_schema(xml, "ats")
        assert result.is_valid is True

    def test_xsd_validation_wrong_root_tag(self):
        validator = XSDValidator()
        result = validator.validate_against_sri_schema("<wrongRoot/>", "factura")
        assert result.is_valid is False

    def test_xsd_validation_with_schema(self):
        validator = XSDValidator()
        xsd = """<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="item" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>"""
        result = validator.validate("<root><item>test</item></root>", xsd)
        assert result.is_valid is True

    def test_xsd_validation_fails_schema(self):
        validator = XSDValidator()
        xsd = """<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="item" type="xs:decimal"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>"""
        result = validator.validate("<root><item>not-a-number</item></root>", xsd)
        assert result.is_valid is False
