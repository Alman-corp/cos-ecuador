import pytest
from decimal import Decimal
from engines.iva_engine import (
    IVAEngine, IVACalculationInput, IVACalculationResult,
    IVARates, IVA_RATES, calcular_iva,
)
from engines.formularios import (
    Formulario104, Formulario104Resultado,
    TipoDeclaracion, TipoContribuyente,
)


class TestIVARates:
    """Pruebas de las tarifas de IVA configuradas."""

    def test_tarifa_0(self):
        assert IVA_RATES.tarifa_0 == Decimal("0")

    def test_tarifa_12(self):
        assert IVA_RATES.tarifa_12 == Decimal("12")

    def test_tarifa_15(self):
        assert IVA_RATES.tarifa_15 == Decimal("15")

    def test_active_rates_includes_15(self):
        engine = IVAEngine(use_tarifa_15=True)
        rates = engine.get_active_rates()
        labels = [r[0] for r in rates]
        assert "15%" in labels

    def test_active_rates_excludes_15(self):
        engine = IVAEngine(use_tarifa_15=False)
        rates = engine.get_active_rates()
        labels = [r[0] for r in rates]
        assert "15%" not in labels


class TestCalcularIVA:
    """Pruebas de la función calcular_iva."""

    def test_calcular_iva_12_percent(self):
        iva = calcular_iva(Decimal("1000"), Decimal("12"))
        assert iva == Decimal("120.00")

    def test_calcular_iva_15_percent(self):
        iva = calcular_iva(Decimal("1000"), Decimal("15"))
        assert iva == Decimal("150.00")

    def test_calcular_iva_zero_base(self):
        iva = calcular_iva(Decimal("0"), Decimal("12"))
        assert iva == Decimal("0.00")

    def test_calcular_iva_rounding(self):
        iva = calcular_iva(Decimal("33.33"), Decimal("12"))
        assert iva == Decimal("4.00")


class TestIVAEngine:
    """Pruebas del motor de cálculo de IVA."""

    def test_iva_0_percent(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(ventas_tarifa_0=Decimal("1000")))
        assert result.iva_ventas_tarifa_12 == Decimal("0.00")
        assert result.total_iva_ventas == Decimal("0.00")

    def test_iva_12_percent(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(ventas_tarifa_12=Decimal("1000")))
        assert result.iva_ventas_tarifa_12 == Decimal("120.00")
        assert result.total_iva_ventas == Decimal("120.00")

    def test_iva_15_percent(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(ventas_tarifa_15=Decimal("1000")))
        assert result.iva_ventas_tarifa_15 == Decimal("150.00")
        assert result.total_iva_ventas == Decimal("150.00")

    def test_iva_ventas_credito(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(
            ventas_tarifa_12=Decimal("2000"),
            compras_tarifa_12=Decimal("500"),
        ))
        assert result.iva_ventas_tarifa_12 == Decimal("240.00")
        assert result.iva_compras_tarifa_12 == Decimal("60.00")
        assert result.iva_a_pagar == Decimal("180.00")

    def test_iva_credito_exceeds(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(
            ventas_tarifa_12=Decimal("500"),
            compras_tarifa_12=Decimal("2000"),
        ))
        assert result.iva_ventas_tarifa_12 == Decimal("60.00")
        assert result.iva_compras_tarifa_12 == Decimal("240.00")
        assert result.iva_a_pagar == Decimal("0")
        assert result.credito_tributario_total == Decimal("240.00")

    def test_exportaciones_0(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(exportaciones=Decimal("5000")))
        assert result.total_iva_ventas == Decimal("0.00")

    def test_iva_tarifas_mixtas(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(
            ventas_tarifa_12=Decimal("1000"),
            ventas_tarifa_15=Decimal("500"),
        ))
        assert result.iva_ventas_tarifa_12 == Decimal("120.00")
        assert result.iva_ventas_tarifa_15 == Decimal("75.00")
        assert result.total_iva_ventas == Decimal("195.00")

    def test_retenciones_iva_incluidas(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(
            ventas_tarifa_12=Decimal("1000"),
            retenciones_iva_30=Decimal("36.00"),
            retenciones_iva_70=Decimal("84.00"),
        ))
        assert result.total_retenciones_iva == Decimal("120.00")
        assert result.credito_tributario_total == Decimal("120.00")
        assert result.credito_tributario_total == result.total_retenciones_iva

    def test_credito_mes_anterior(self):
        engine = IVAEngine()
        result = engine.calculate(IVACalculationInput(
            ventas_tarifa_12=Decimal("1000"),
            credito_tributario_mes_anterior=Decimal("50.00"),
        ))
        assert result.credito_tributario_total == Decimal("50.00")

    def test_form_104_generation(self):
        engine = IVAEngine()
        form = Formulario104(
            ruc="1799999999001",
            razon_social="TEST S.A.",
            periodo_fiscal="01-2026",
            tipo_declaracion=TipoDeclaracion.MENSUAL,
            tipo_contribuyente=TipoContribuyente.SOCIEDAD,
            ventas_tarifa_12=Decimal("2000"),
            compras_tarifa_12=Decimal("500"),
        )
        result = engine.generate_form104(form)
        assert isinstance(result, Formulario104Resultado)
        assert result.total_iva_ventas == Decimal("240.00")
        assert result.total_iva_compras == Decimal("60.00")
        assert result.valor_a_pagar == Decimal("180.00")
        assert result.subtotal_iva_a_pagar == result.total_iva_ventas

    def test_form_104_has_required_fields(self):
        engine = IVAEngine()
        form = Formulario104(
            ruc="1799999999001",
            razon_social="TEST S.A.",
            periodo_fiscal="01-2026",
            tipo_declaracion=TipoDeclaracion.MENSUAL,
            tipo_contribuyente=TipoContribuyente.SOCIEDAD,
            ventas_tarifa_12=Decimal("2000"),
            compras_tarifa_12=Decimal("500"),
        )
        result = engine.generate_form104(form)
        data = result.model_dump()
        required = [
            "form104", "iva_ventas_tarifa_12", "iva_ventas_tarifa_15",
            "total_iva_ventas", "iva_compras_tarifa_12", "iva_compras_tarifa_15",
            "total_iva_compras", "total_retenciones_iva",
            "subtotal_iva_a_pagar", "credito_tributario_total",
            "valor_a_pagar", "total_con_multa_intereses",
        ]
        for field in required:
            assert field in data, f"Campo {field} faltante en Formulario104Resultado"

    def test_form_104_con_multa_intereses(self):
        engine = IVAEngine()
        form = Formulario104(
            ruc="1799999999001",
            razon_social="TEST S.A.",
            periodo_fiscal="01-2026",
            tipo_declaracion=TipoDeclaracion.MENSUAL,
            tipo_contribuyente=TipoContribuyente.SOCIEDAD,
            ventas_tarifa_12=Decimal("2000"),
            compras_tarifa_12=Decimal("500"),
            multa=Decimal("10.00"),
            interes=Decimal("5.00"),
        )
        result = engine.generate_form104(form)
        assert result.total_con_multa_intereses == Decimal("195.00")

    def test_monthly_summary(self):
        engine = IVAEngine()
        summary = engine.monthly_summary(
            ventas_por_tarifa={"12%": Decimal("2000")},
            compras_por_tarifa={"12%": Decimal("500")},
            retenciones_periodo={},
        )
        assert summary["iva_a_pagar"] == 180.0
        assert summary["total_iva_ventas"] == 240.0
        assert summary["total_iva_compras"] == 60.0
