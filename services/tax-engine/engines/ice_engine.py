"""Motor de cálculo del Impuesto a los Consumos Especiales (ICE).
Soporta impuestos específicos (por unidad) y ad-valorem (%).
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class CategoriaICE(str, Enum):
    CIGARRILLOS = "CIGARRILLOS"
    BEBIDAS_ALCOHOLICAS = "BEBIDAS_ALCOHOLICAS"
    BEBIDAS_GASEOSAS = "BEBIDAS_GASEOSAS"
    VEHICULOS = "VEHICULOS"
    PERFUMES = "PERFUMES"
    ARTEFACTOS_ELECTRONICOS = "ARTEFACTOS_ELECTRONICOS"
    LICORES = "LICORES"
    CERVEZA = "CERVEZA"
    OTROS = "OTROS"


class ProductoICE(BaseModel):
    """Configuración de producto para cálculo ICE."""
    categoria: CategoriaICE
    nombre: str
    ice_especifico: Decimal = Decimal("0")
    ice_ad_valorem: Decimal = Decimal("0")
    unidad_medida: str = "unidad"


# Catálogo de productos ICE con tasas
CATALOGO_ICE: Dict[CategoriaICE, ProductoICE] = {
    CategoriaICE.CIGARRILLOS: ProductoICE(
        categoria=CategoriaICE.CIGARRILLOS,
        nombre="Cigarrillos",
        ice_especifico=Decimal("0.18"),
        ice_ad_valorem=Decimal("150"),
    ),
    CategoriaICE.BEBIDAS_ALCOHOLICAS: ProductoICE(
        categoria=CategoriaICE.BEBIDAS_ALCOHOLICAS,
        nombre="Bebidas alcohólicas",
        ice_especifico=Decimal("7.50"),
        ice_ad_valorem=Decimal("75"),
    ),
    CategoriaICE.CERVEZA: ProductoICE(
        categoria=CategoriaICE.CERVEZA,
        nombre="Cerveza",
        ice_especifico=Decimal("3.00"),
        ice_ad_valorem=Decimal("30"),
    ),
    CategoriaICE.LICORES: ProductoICE(
        categoria=CategoriaICE.LICORES,
        nombre="Licores importados",
        ice_especifico=Decimal("12.00"),
        ice_ad_valorem=Decimal("100"),
    ),
    CategoriaICE.BEBIDAS_GASEOSAS: ProductoICE(
        categoria=CategoriaICE.BEBIDAS_GASEOSAS,
        nombre="Bebidas gaseosas",
        ice_especifico=Decimal("0"),
        ice_ad_valorem=Decimal("10"),
    ),
    CategoriaICE.PERFUMES: ProductoICE(
        categoria=CategoriaICE.PERFUMES,
        nombre="Perfumes y cosméticos importados",
        ice_especifico=Decimal("0"),
        ice_ad_valorem=Decimal("15"),
    ),
    CategoriaICE.VEHICULOS: ProductoICE(
        categoria=CategoriaICE.VEHICULOS,
        nombre="Vehículos motorizados",
        ice_especifico=Decimal("0"),
        ice_ad_valorem=Decimal("15"),
    ),
    CategoriaICE.ARTEFACTOS_ELECTRONICOS: ProductoICE(
        categoria=CategoriaICE.ARTEFACTOS_ELECTRONICOS,
        nombre="Artefactos electrónicos",
        ice_especifico=Decimal("0"),
        ice_ad_valorem=Decimal("5"),
    ),
    CategoriaICE.OTROS: ProductoICE(
        categoria=CategoriaICE.OTROS,
        nombre="Otros productos gravados con ICE",
        ice_especifico=Decimal("0"),
        ice_ad_valorem=Decimal("0"),
    ),
}


class ICECalculationInput(BaseModel):
    """Entrada para cálculo de ICE."""
    categoria: CategoriaICE
    cantidad: int = Field(default=1, ge=0)
    base_imponible_unitaria: Decimal = Field(..., max_digits=14, decimal_places=2)
    ice_especifico_personalizado: Optional[Decimal] = None
    ice_ad_valorem_personalizado: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None


class ICECalculationResult(BaseModel):
    """Resultado del cálculo de ICE."""
    categoria: CategoriaICE
    producto: str
    cantidad: int
    base_imponible_total: Decimal
    ice_especifico: Decimal
    ice_ad_valorem: Decimal
    ice_total: Decimal
    detalle: Dict


class ICERates(BaseModel):
    """Tarifas ICE por categoría."""
    productos: List[ProductoICE]
    descripcion: str = "Tasas ICE vigentes Ecuador"


class ICEEngine:
    """Motor de cálculo del Impuesto a los Consumos Especiales.
    ICE Total = ICE Específico + ICE Ad-Valorem
    ICE Específico = Cantidad * Tasa Específica
    ICE Ad-Valorem = Base Imponible * (% Ad-Valorem / 100)
    """

    def get_rates(self) -> ICERates:
        """Retorna todas las tarifas ICE disponibles."""
        return ICERates(productos=list(CATALOGO_ICE.values()))

    def get_product_config(self, categoria: CategoriaICE) -> ProductoICE:
        """Obtiene la configuración ICE para una categoría."""
        return CATALOGO_ICE.get(categoria, CATALOGO_ICE[CategoriaICE.OTROS])

    def calculate(
        self,
        input_data: ICECalculationInput
    ) -> ICECalculationResult:
        """Calcula el ICE total para una categoría de producto.
        ICE Específico = Cantidad * Tasa Específica (por unidad)
        ICE Ad-Valorem = Base Imponible * (% / 100)
        ICE Total = ICE Específico + ICE Ad-Valorem
        """
        config = self.get_product_config(input_data.categoria)

        tasa_especifica = (
            input_data.ice_especifico_personalizado
            if input_data.ice_especifico_personalizado is not None
            else config.ice_especifico
        )
        tasa_advalorem = (
            input_data.ice_ad_valorem_personalizado
            if input_data.ice_ad_valorem_personalizado is not None
            else config.ice_ad_valorem
        )

        cantidad = Decimal(str(input_data.cantidad))
        base_total = (input_data.base_imponible_unitaria * cantidad).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        ice_especifico = (tasa_especifica * cantidad).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        ice_ad_valorem = (base_total * tasa_advalorem / Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        ice_total = (ice_especifico + ice_ad_valorem).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        detalle = {
            "categoria": input_data.categoria.value,
            "cantidad": input_data.cantidad,
            "base_imponible_unitaria": float(input_data.base_imponible_unitaria),
            "base_imponible_total": float(base_total),
            "tasa_especifica": float(tasa_especifica),
            "tasa_ad_valorem": float(tasa_advalorem),
            "formula": "ICE = (Cant * TasaEsp) + (BaseTotal * TasaAV / 100)",
        }

        return ICECalculationResult(
            categoria=input_data.categoria,
            producto=config.nombre,
            cantidad=input_data.cantidad,
            base_imponible_total=base_total,
            ice_especifico=ice_especifico,
            ice_ad_valorem=ice_ad_valorem,
            ice_total=ice_total,
            detalle=detalle,
        )
