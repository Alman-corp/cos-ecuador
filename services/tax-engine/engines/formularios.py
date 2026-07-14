"""Modelos de datos para formularios SRI - Formulario 104 (IVA)."""

from datetime import date
from decimal import Decimal
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class TipoContribuyente(str, Enum):
    PERSONA_NATURAL = "PERSONA_NATURAL"
    SOCIEDAD = "SOCIEDAD"


class TipoDeclaracion(str, Enum):
    MENSUAL = "MENSUAL"
    SEMESTRAL = "SEMESTRAL"


class Formulario104(BaseModel):
    """Formulario 104 - Declaración de IVA.
    https://www.sri.gob.ec/formulario-104
    """
    ruc: str = Field(..., pattern=r"^\d{13}$")
    razon_social: str
    periodo_fiscal: str = Field(..., description="Formato: MM-YYYY")
    tipo_declaracion: TipoDeclaracion
    tipo_contribuyente: TipoContribuyente

    # Ventas (Casillero 401 y relacionados)
    ventas_tarifa_0: Decimal = Field(Decimal("0"), max_digits=14, decimal_places=2)
    ventas_tarifa_12: Decimal = Field(Decimal("0"), max_digits=14, decimal_places=2)
    ventas_tarifa_15: Decimal = Field(Decimal("0"), max_digits=14, decimal_places=2)
    ventas_no_objeto_iva: Decimal = Field(Decimal("0"), max_digits=14, decimal_places=2)
    exportaciones: Decimal = Field(Decimal("0"), max_digits=14, decimal_places=2)

    # Compras (Casillero 402 y relacionados)
    compras_tarifa_0: Decimal = Field(Decimal("0"), max_digits=14, decimal_places=2)
    compras_tarifa_12: Decimal = Field(Decimal("0"), max_digits=14, decimal_places=2)
    compras_tarifa_15: Decimal = Field(Decimal("0"), max_digits=14, decimal_places=2)
    compras_no_objeto_iva: Decimal = Decimal("0")

    # Retenciones
    retenciones_iva_30: Decimal = Decimal("0")
    retenciones_iva_70: Decimal = Decimal("0")
    retenciones_iva_100: Decimal = Decimal("0")

    # Crédito tributario meses anteriores
    credito_tributario_mes_anterior: Decimal = Decimal("0")

    # Multas e intereses
    multa: Decimal = Decimal("0")
    interes: Decimal = Decimal("0")


class Formulario104Resultado(BaseModel):
    """Resultado del cálculo del Formulario 104."""
    form104: Formulario104

    iva_ventas_tarifa_12: Decimal = Decimal("0")
    iva_ventas_tarifa_15: Decimal = Decimal("0")
    total_iva_ventas: Decimal = Decimal("0")

    iva_compras_tarifa_12: Decimal = Decimal("0")
    iva_compras_tarifa_15: Decimal = Decimal("0")
    total_iva_compras: Decimal = Decimal("0")

    total_retenciones_iva: Decimal = Decimal("0")
    subtotal_iva_a_pagar: Decimal = Decimal("0")
    credito_tributario_total: Decimal = Decimal("0")
    valor_a_pagar: Decimal = Decimal("0")
    total_con_multa_intereses: Decimal = Decimal("0")
