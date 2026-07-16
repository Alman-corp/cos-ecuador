import pytest
from decimal import Decimal
from datetime import date
from app.generators.ats_generator import ATSGenerator, ATSInput, ATSComprobante


def test_ats_generacion_basica():
    input_data = ATSInput(
        tenant_id="t1", ruc_obligado="1790012345001", razon_social="Test SA",
        tipo_ambiente=1, periodo_fiscal="202403",
        compras=[
            ATSComprobante(
                codigo_sustento="01", tipo_comprobante="01", numero_comprobante="001-001-000000001",
                fecha_comprobante=date(2024, 3, 10), ruc_proveedor="1790056789001",
                razon_social="Proveedor Test", base_imponible_iva=Decimal("1000"),
                tarifa_iva=12, iva_generado=Decimal("120"),
            )
        ],
        ventas=[
            ATSComprobante(
                codigo_sustento="01", tipo_comprobante="01", numero_comprobante="001-001-000000002",
                fecha_comprobante=date(2024, 3, 15), ruc_proveedor="1790098765001",
                razon_social="Cliente Test", base_imponible_iva=Decimal("5000"),
                tarifa_iva=12, iva_generado=Decimal("600"),
            )
        ],
    )
    result = ATSGenerator.generate(input_data)
    assert "AnexoTransaccionalSimplificado" in result.xml_content
    assert result.resumen["num_compras"] == 1
    assert result.resumen["num_ventas"] == 1
    assert result.resumen["total_iva_compras"] == 120
    assert result.resumen["total_iva_ventas"] == 600


def test_ats_ruc_invalido():
    input_data = ATSInput(
        tenant_id="t1", ruc_obligado="1790012345001", razon_social="Test SA",
        tipo_ambiente=1, periodo_fiscal="202403",
        compras=[
            ATSComprobante(
                codigo_sustento="01", tipo_comprobante="01", numero_comprobante="001-001-000000001",
                fecha_comprobante=date(2024, 3, 10), ruc_proveedor="123",
                razon_social="Malo", base_imponible_iva=Decimal("100"),
                tarifa_iva=12, iva_generado=Decimal("12"),
            )
        ],
        ventas=[],
    )
    result = ATSGenerator.generate(input_data)
    assert len(result.validaciones) > 0
