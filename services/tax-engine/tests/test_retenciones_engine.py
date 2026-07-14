import pytest
from decimal import Decimal
from engines.retenciones_engine import (
    RetencionesEngine, RetencionCalculationInput, RetencionCalculationResult,
    TipoRetencion, RetencionIVA, RetencionCatalogEntry,
    CATALOGO_RETENCIONES_SRI,
)


class TestCatalogoRetenciones:
    """Pruebas del catálogo SRI de retenciones."""

    def test_catalogo_has_entries(self):
        assert len(CATALOGO_RETENCIONES_SRI) >= 10

    def test_catalogo_codes_are_unique(self):
        codigos = [e.codigo for e in CATALOGO_RETENCIONES_SRI]
        assert len(codigos) == len(set(codigos))

    def test_catalogo_contains_all_tipos(self):
        codigos_sri = {e.codigo for e in CATALOGO_RETENCIONES_SRI}
        from engines.retenciones_engine import RetencionesEngine
        engine = RetencionesEngine()
        for t in TipoRetencion:
            assert engine.CODIGOS_SRI[t] in codigos_sri, f"Tipo {t.value} no tiene código en catálogo"

    def test_catalogo_porcentajes_positivos(self):
        for entry in CATALOGO_RETENCIONES_SRI:
            assert entry.porcentaje > Decimal("0")


class TestRetencionesEngine:
    """Pruebas del motor de cálculo de retenciones."""

    def test_retencion_1_percent_sociedades(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.BIENES_SOCIEDADES,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("10.00")
        assert result.codigo_sri == "304"

    def test_retencion_1_percent_combustibles(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.COMBUSTIBLES,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("10.00")
        assert result.codigo_sri == "305"

    def test_retencion_2_percent_honorarios(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.HONORARIOS_PROFESIONALES,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("20.00")
        assert result.codigo_sri == "307"

    def test_retencion_2_percent_arriendos(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.ARRIENDOS,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("20.00")

    def test_retencion_8_percent(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.IMPUESTO_UNICO_HERENCIAS,
            base_imponible=Decimal("10000"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("800.00")
        assert result.codigo_sri == "310"

    def test_retencion_10_percent(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.RENDIMIENTOS_FINANCIEROS_PN,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("100.00")
        assert result.codigo_sri == "311"

    def test_retencion_25_percent_exterior(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.PAGOS_EXTERIOR,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("250.00")
        assert result.codigo_sri == "312"

    def test_retencion_25_percent_offshore(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.SERVICIOS_OFFSHORE,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("250.00")
        assert result.codigo_sri == "313"

    def test_retencion_iva_30(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.BIENES_SOCIEDADES,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
            retencion_iva_tipo=RetencionIVA.IVA_30,
            base_iva=Decimal("1000"),
        ))
        assert result.retencion_iva_valor == Decimal("36.00")

    def test_retencion_iva_70(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.BIENES_SOCIEDADES,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
            retencion_iva_tipo=RetencionIVA.IVA_70,
            base_iva=Decimal("1000"),
        ))
        assert result.retencion_iva_valor == Decimal("84.00")

    def test_retencion_iva_100(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.BIENES_SOCIEDADES,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
            retencion_iva_tipo=RetencionIVA.IVA_100,
            base_iva=Decimal("1000"),
        ))
        assert result.retencion_iva_valor == Decimal("120.00")

    def test_retencion_total_con_iva(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.BIENES_SOCIEDADES,
            base_imponible=Decimal("1000"),
            sujeto_pasivo="1799999999001",
            retencion_iva_tipo=RetencionIVA.IVA_30,
            base_iva=Decimal("1000"),
        ))
        assert result.valor_retenido == Decimal("10.00")
        assert result.retencion_iva_valor == Decimal("36.00")
        assert result.total_retenido == Decimal("46.00")

    def test_invalid_code(self):
        engine = RetencionesEngine()
        with pytest.raises((KeyError, ValueError)):
            engine.calculate(RetencionCalculationInput(
                tipo="INVALIDO",
                base_imponible=Decimal("1000"),
                sujeto_pasivo="1799999999001",
            ))

    def test_all_catalog_codes(self):
        engine = RetencionesEngine()
        for entry in CATALOGO_RETENCIONES_SRI:
            tipo = next(
                (t for t in TipoRetencion if engine.CODIGOS_SRI.get(t) == entry.codigo),
                None,
            )
            if tipo is None:
                continue
            result = engine.calculate(RetencionCalculationInput(
                tipo=tipo,
                base_imponible=Decimal("100"),
                sujeto_pasivo="1799999999001",
            ))
            esperado = Decimal("100") * entry.porcentaje / Decimal("100")
            assert result.valor_retenido == esperado.quantize(Decimal("0.01"))

    def test_validate_retencion_correct(self):
        engine = RetencionesEngine()
        assert engine.validate_retencion(Decimal("1000"), Decimal("2"), Decimal("20")) is True

    def test_validate_retencion_incorrect(self):
        engine = RetencionesEngine()
        assert engine.validate_retencion(Decimal("1000"), Decimal("2"), Decimal("15")) is False

    def test_retencion_cero_base(self):
        engine = RetencionesEngine()
        result = engine.calculate(RetencionCalculationInput(
            tipo=TipoRetencion.BIENES_SOCIEDADES,
            base_imponible=Decimal("0"),
            sujeto_pasivo="1799999999001",
        ))
        assert result.valor_retenido == Decimal("0.00")
