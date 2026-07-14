import pytest
from decimal import Decimal
from engines.ice_engine import (
    ICEEngine, ICECalculationInput, ICECalculationResult,
    CategoriaICE, CATALOGO_ICE, ICERates,
)


class TestICEConfig:
    """Pruebas de la configuración del catálogo ICE."""

    def test_catalogo_has_categories(self):
        assert len(CATALOGO_ICE) >= 8

    def test_categoria_cigarrillos_has_especifico(self):
        config = CATALOGO_ICE[CategoriaICE.CIGARRILLOS]
        assert config.ice_especifico == Decimal("0.18")

    def test_categoria_gaseosas_no_especifico(self):
        config = CATALOGO_ICE[CategoriaICE.BEBIDAS_GASEOSAS]
        assert config.ice_especifico == Decimal("0")
        assert config.ice_ad_valorem == Decimal("10")

    def test_get_rates_returns_all(self):
        engine = ICEEngine()
        rates = engine.get_rates()
        assert isinstance(rates, ICERates)
        assert len(rates.productos) == len(CATALOGO_ICE)

    def test_get_product_config_exists(self):
        engine = ICEEngine()
        config = engine.get_product_config(CategoriaICE.PERFUMES)
        assert config.nombre == "Perfumes y cosméticos importados"

    def test_get_product_config_unknown_fallsback(self):
        engine = ICEEngine()
        config = engine.get_product_config(CategoriaICE.OTROS)
        assert config.categoria == CategoriaICE.OTROS


class TestICECalculation:
    """Pruebas del cálculo del ICE."""

    def test_cigarettes_especifico(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.CIGARRILLOS,
            cantidad=100,
            base_imponible_unitaria=Decimal("1"),
        ))
        assert result.ice_especifico == Decimal("18.00")

    def test_cigarettes_ad_valorem(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.CIGARRILLOS,
            cantidad=100,
            base_imponible_unitaria=Decimal("1"),
        ))
        assert result.ice_ad_valorem == Decimal("150.00")

    def test_soft_drinks(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.BEBIDAS_GASEOSAS,
            cantidad=1,
            base_imponible_unitaria=Decimal("1000"),
        ))
        assert result.ice_total == Decimal("100.00")
        assert result.ice_ad_valorem == Decimal("100.00")
        assert result.ice_especifico == Decimal("0.00")

    def test_perfumes(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.PERFUMES,
            cantidad=1,
            base_imponible_unitaria=Decimal("5000"),
        ))
        assert result.ice_total == Decimal("750.00")

    def test_vehiculo_standard(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.VEHICULOS,
            cantidad=1,
            base_imponible_unitaria=Decimal("20000"),
        ))
        assert result.ice_total == Decimal("3000.00")

    def test_vehiculo_alto_valor(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.VEHICULOS,
            cantidad=1,
            base_imponible_unitaria=Decimal("60000"),
        ))
        assert result.ice_total == Decimal("9000.00")

    def test_ice_multiples_unidades(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.BEBIDAS_GASEOSAS,
            cantidad=10,
            base_imponible_unitaria=Decimal("100"),
        ))
        assert result.ice_total == Decimal("100.00")

    def test_cerveza(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.CERVEZA,
            cantidad=12,
            base_imponible_unitaria=Decimal("2"),
        ))
        expected_espec = Decimal("12") * Decimal("3.00")
        expected_av = (Decimal("12") * Decimal("2")) * Decimal("30") / Decimal("100")
        expected_total = expected_espec + expected_av
        assert result.ice_total == expected_total

    def test_ice_custom_rates(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.BEBIDAS_GASEOSAS,
            cantidad=1,
            base_imponible_unitaria=Decimal("1000"),
            ice_ad_valorem_personalizado=Decimal("15"),
        ))
        assert result.ice_total == Decimal("150.00")

    def test_zero_quantity(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.CIGARRILLOS,
            cantidad=0,
            base_imponible_unitaria=Decimal("1000"),
        ))
        assert result.ice_total == Decimal("0.00")
        assert result.ice_especifico == Decimal("0.00")
        assert result.ice_ad_valorem == Decimal("0.00")

    def test_invalid_category(self):
        engine = ICEEngine()
        with pytest.raises(Exception):
            engine.calculate(ICECalculationInput(
                categoria="CATEGORIA_INVALIDA",
                cantidad=1,
                base_imponible_unitaria=Decimal("1000"),
            ))

    def test_producto_result(self):
        engine = ICEEngine()
        result = engine.calculate(ICECalculationInput(
            categoria=CategoriaICE.CIGARRILLOS,
            cantidad=10,
            base_imponible_unitaria=Decimal("5"),
        ))
        assert isinstance(result, ICECalculationResult)
        assert result.producto == "Cigarrillos"
        assert result.categoria == CategoriaICE.CIGARRILLOS
        assert result.cantidad == 10
