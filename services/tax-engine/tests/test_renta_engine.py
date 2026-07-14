import pytest
from decimal import Decimal
from engines.renta_engine import (
    RentaEngine, PersonalRentaInput, CorporateRentaInput,
    GastosPersonalesInput, AnticipoInput, RentaCalculationResult,
    TipoContribuyenteRenta, RentRates, TABLA_IR_PERSONAS_NATURALES,
    GASTOS_PERSONALES_TOPE, TOTAL_GASTOS_TOPE,
)


class TestRentaTables:
    """Pruebas de la tabla de IR y tarifas."""

    def test_tabla_has_brackets(self):
        assert len(TABLA_IR_PERSONAS_NATURALES) == 10

    def test_tabla_brackets_ascending(self):
        for i in range(len(TABLA_IR_PERSONAS_NATURALES) - 1):
            assert TABLA_IR_PERSONAS_NATURALES[i].fraccion_basica <= TABLA_IR_PERSONAS_NATURALES[i + 1].fraccion_basica

    def test_rent_rates_corporate(self):
        rates = RentRates()
        assert rates.tarifa_sociedades == Decimal("28")

    def test_topes_gastos_personales(self):
        for categoria, tope in GASTOS_PERSONALES_TOPE.items():
            assert tope == Decimal("7733")

    def test_tope_total_gastos(self):
        assert TOTAL_GASTOS_TOPE == Decimal("15467")


class TestRentaPersonal:
    """Pruebas del cálculo de IR para personas naturales."""

    def test_personal_below_threshold(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("10000")))
        assert result.impuesto_causado == Decimal("0.00")
        assert result.base_imponible == Decimal("10000.00")

    def test_personal_at_threshold(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("11270")))
        assert result.impuesto_causado == Decimal("0.00")

    def test_personal_first_bracket(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("12000")))
        assert result.impuesto_causado == Decimal("36.50")

    def test_personal_second_bracket(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("15000")))
        assert result.impuesto_causado == Decimal("227.50")

    def test_personal_mid_bracket(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("60000")))
        assert result.impuesto_causado == Decimal("9368.70")

    def test_personal_high_bracket(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("120000")))
        assert result.impuesto_causado == Decimal("30513.90")

    def test_personal_very_high_income(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("250000")))
        assert result.impuesto_causado == Decimal("78613.90")

    def test_personal_deductions_capped(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(
            ingresos_anuales=Decimal("40000"),
            gastos_personales=GastosPersonalesInput(vivienda=Decimal("15000")),
        ))
        assert result.deducciones_totales == Decimal("7733.00")
        assert result.base_imponible == Decimal("32267.00")
        assert result.impuesto_causado == Decimal("2586.10")

    def test_personal_multiple_deductions(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(
            ingresos_anuales=Decimal("40000"),
            gastos_personales=GastosPersonalesInput(
                vivienda=Decimal("8000"),
                educacion=Decimal("8000"),
                salud=Decimal("8000"),
                alimentacion=Decimal("8000"),
            ),
        ))
        assert result.deducciones_totales == Decimal("15467.00")
        assert result.base_imponible == Decimal("24533.00")
        assert result.impuesto_causado == Decimal("1394.65")

    def test_personal_with_iess(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(
            ingresos_anuales=Decimal("25000"),
            aportes_seguridad_social=Decimal("2500"),
        ))
        assert result.base_imponible == Decimal("22500.00")

    def test_empty_income(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("0")))
        assert result.impuesto_causado == Decimal("0.00")

    def test_negative_income(self):
        engine = RentaEngine()
        result = engine.calculate_personal(PersonalRentaInput(ingresos_anuales=Decimal("-5000")))
        assert result.impuesto_causado == Decimal("0.00")
        assert result.base_imponible == Decimal("0.00")


class TestRentaCorporate:
    """Pruebas del cálculo de IR para sociedades."""

    def test_corporate_28_percent(self):
        engine = RentaEngine()
        result = engine.calculate_corporate(CorporateRentaInput(
            ingresos_anuales=Decimal("100000"),
            costos_gastos_deducibles=Decimal("0"),
        ))
        assert result.impuesto_causado == Decimal("28000.00")
        assert result.tipo_contribuyente == TipoContribuyenteRenta.SOCIEDAD

    def test_corporate_with_deductions(self):
        engine = RentaEngine()
        result = engine.calculate_corporate(CorporateRentaInput(
            ingresos_anuales=Decimal("100000"),
            costos_gastos_deducibles=Decimal("40000"),
        ))
        assert result.base_imponible == Decimal("60000.00")
        assert result.impuesto_causado == Decimal("16800.00")

    def test_corporate_with_non_deductible(self):
        engine = RentaEngine()
        result = engine.calculate_corporate(CorporateRentaInput(
            ingresos_anuales=Decimal("100000"),
            costos_gastos_deducibles=Decimal("40000"),
            gastos_no_deducibles=Decimal("5000"),
        ))
        assert result.base_imponible == Decimal("65000.00")
        assert result.impuesto_causado == Decimal("18200.00")

    def test_corporate_zero_profit(self):
        engine = RentaEngine()
        result = engine.calculate_corporate(CorporateRentaInput(
            ingresos_anuales=Decimal("50000"),
            costos_gastos_deducibles=Decimal("50000"),
        ))
        assert result.base_imponible == Decimal("0.00")
        assert result.impuesto_causado == Decimal("0.00")

    def test_corporate_negative_base(self):
        engine = RentaEngine()
        result = engine.calculate_corporate(CorporateRentaInput(
            ingresos_anuales=Decimal("30000"),
            costos_gastos_deducibles=Decimal("50000"),
        ))
        assert result.base_imponible == Decimal("0.00")
        assert result.impuesto_causado == Decimal("0.00")

    def test_anticipo_in_result(self):
        engine = RentaEngine()
        result = engine.calculate_corporate(CorporateRentaInput(
            ingresos_anuales=Decimal("100000"),
        ))
        assert result.anticipo_proximo_anio is not None

    def test_anticipo_calculation(self):
        engine = RentaEngine()
        result = engine.calculate_anticipo(AnticipoInput(
            impuesto_causado_anio_anterior=Decimal("28000"),
            ingresos_anuales=Decimal("100000"),
            activo_real=Decimal("200000"),
            gastos_deducibles=Decimal("40000"),
        ))
        assert result["porcentaje"] == 3.0
        assert result["anticipo_calculado"] > 0

    def test_corporate_detalle_has_required_fields(self):
        engine = RentaEngine()
        result = engine.calculate_corporate(CorporateRentaInput(
            ingresos_anuales=Decimal("100000"),
        ))
        for field in ["ingresos_anuales", "base_imponible", "tasa_aplicada"]:
            assert field in result.detalle
