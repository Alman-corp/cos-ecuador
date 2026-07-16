import pytest
from decimal import Decimal
from app.calculators.renta_calculator import RentaCalculator, RentaInput, IngresosAnuales, GastosAnuales
from app.calculators.constants import RentTaxRate


def test_renta_sociedad_25():
    input_data = RentaInput(
        tenant_id="t1", client_ruc="1790012345001", fiscal_year=2024,
        tipo_contribuyente=RentTaxRate.SOCIEDADES,
        ingresos=IngresosAnuales(ingresos_gravados=Decimal("500000")),
        gastos=GastosAnuales(
            costos_ventas=Decimal("200000"), gastos_operativos=Decimal("100000"),
            gastos_administrativos=Decimal("50000"), gastos_financieros=Decimal("10000"),
            sueldos_salarios=Decimal("80000"), beneficios_empleados=Decimal("20000"),
            depreciacion=Decimal("15000"), amortizacion=Decimal("5000"),
        ),
    )
    result = RentaCalculator.calculate(input_data)
    assert result.ingresos_totales == Decimal("500000")
    assert result.participacion_trabajadores == Decimal("3000")
    assert result.impuesto_causado == Decimal("4250")


def test_renta_persona_natural_tabla_progresiva():
    input_data = RentaInput(
        tenant_id="t1", client_ruc="1712345678001", fiscal_year=2024,
        tipo_contribuyente=RentTaxRate.PERSONAS_NATURALES_NO_OBLIGADAS,
        ingresos=IngresosAnuales(ingresos_gravados=Decimal("30000")),
        gastos=GastosAnuales(),
    )
    result = RentaCalculator.calculate(input_data)
    assert result.tabla_progresiva_aplicada is True
    assert result.impuesto_causado == Decimal("1275")
