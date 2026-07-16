import pytest
from decimal import Decimal
from app.calculators.iva_calculator import IVACalculator, IVACalculationInput, InvoiceItem
from app.calculators.constants import IVARetentionType


def test_iva_basico_12_por_ciento():
    input_data = IVACalculationInput(
        tenant_id="t1", client_ruc="1790012345001", fiscal_period="2024-03",
        sales=[InvoiceItem(invoice_number="001-001-000001", date="2024-03-15", ruc_supplier="1790012345001", base_12=Decimal("10000"))],
        purchases=[InvoiceItem(invoice_number="001-001-000002", date="2024-03-10", ruc_supplier="1790056789001", base_12=Decimal("5000"))],
    )
    result = IVACalculator.calculate(input_data)
    assert result.iva_cobrado_12 == Decimal("1200")
    assert result.iva_pagado_12 == Decimal("600")
    assert result.saldo_a_pagar == Decimal("600")


def test_iva_con_retencion_100():
    input_data = IVACalculationInput(
        tenant_id="t1", client_ruc="1790012345001", fiscal_period="2024-03",
        sales=[InvoiceItem(invoice_number="001-001-000003", date="2024-03-20", ruc_supplier="1790012345001", base_15=Decimal("20000"))],
        purchases=[],
        iva_retention_received=[{"invoice_number": "001-001-000003", "retention_type": "AGENTE_100", "iva_amount": Decimal("3000")}],
    )
    result = IVACalculator.calculate(input_data)
    assert result.iva_cobrado_15 == Decimal("3000")
    assert result.retenciones_iva_recibidas == Decimal("3000")
    assert result.saldo_a_pagar == Decimal("0")


def test_iva_saldo_a_favor():
    input_data = IVACalculationInput(
        tenant_id="t1", client_ruc="1790012345001", fiscal_period="2024-03",
        sales=[InvoiceItem(invoice_number="001-001-000004", date="2024-03-15", ruc_supplier="1790012345001", base_12=Decimal("5000"))],
        purchases=[InvoiceItem(invoice_number="001-001-000005", date="2024-03-10", ruc_supplier="1790056789001", base_12=Decimal("20000"))],
    )
    result = IVACalculator.calculate(input_data)
    assert result.saldo_a_pagar == Decimal("0")
    assert result.saldo_a_favor == Decimal("1800")
    assert len(result.warnings) > 0
