import pytest
from decimal import Decimal
from datetime import date
from app.calculators.retenciones_calculator import RetencionesCalculator, RetencionInput
from app.calculators.constants import RetencionType


def test_retencion_honorarios_10():
    retenciones = [
        RetencionInput(
            invoice_number="001-001-000001", invoice_date=date(2024, 3, 15),
            supplier_ruc="1712345678001", supplier_name="Consultor",
            retencion_type=RetencionType.HONORARIOS_PROFESIONALES,
            base_imponible=Decimal("1000"),
        )
    ]
    result = RetencionesCalculator.calculate(retenciones)
    assert result.total_retenido == Decimal("100")
    assert result.total_base == Decimal("1000")


def test_retencion_exterior_minimo_22():
    retenciones = [
        RetencionInput(
            invoice_number="001-001-000002", invoice_date=date(2024, 3, 20),
            supplier_ruc="9999999999999", supplier_name="Proveedor USA",
            retencion_type=RetencionType.TRANSFERENCIA_BIENES,
            base_imponible=Decimal("5000"), es_exterior=True,
        )
    ]
    result = RetencionesCalculator.calculate(retenciones)
    assert result.total_retenido == Decimal("1100")


def test_retencion_paraiso_fiscal_35():
    retenciones = [
        RetencionInput(
            invoice_number="001-001-000003", invoice_date=date(2024, 3, 25),
            supplier_ruc="9999999999999", supplier_name="Offshore",
            retencion_type=RetencionType.RENDIMIENTOS_FINANCIEROS,
            base_imponible=Decimal("10000"), aplica_paraiso_fiscal=True,
        )
    ]
    result = RetencionesCalculator.calculate(retenciones)
    assert result.total_retenido == Decimal("3500")
