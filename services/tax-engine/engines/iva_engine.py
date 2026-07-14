"""Motor de cálculo de IVA - Formulario 104 mensual/semestral.
Soporta tarifas 0%, 12% y 15% (reforma septiembre 2025).
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from enum import Enum
from datetime import date

from .formularios import (
    Formulario104, Formulario104Resultado,
    TipoDeclaracion, TipoContribuyente
)


class TasaIVA(str, Enum):
    TARIFA_0 = "0%"
    TARIFA_12 = "12%"
    TARIFA_15 = "15%"


class IVARates(BaseModel):
    """Tarifas de IVA vigentes."""
    tarifa_0: Decimal = Decimal("0")
    tarifa_12: Decimal = Decimal("12")
    tarifa_15: Decimal = Decimal("15")
    periodo_aplicacion_15: str = "2025-09-01"
    descripcion: str = "Tarifas IVA Ecuador. Tarifa 15% aplica desde septiembre 2025 según reforma tributaria."


IVA_RATES = IVARates()


class IVACalculationInput(BaseModel):
    """Entrada para cálculo de IVA mensual."""
    ventas_tarifa_0: Decimal = Decimal("0")
    ventas_tarifa_12: Decimal = Decimal("0")
    ventas_tarifa_15: Decimal = Decimal("0")
    ventas_no_objeto_iva: Decimal = Decimal("0")
    exportaciones: Decimal = Decimal("0")
    compras_tarifa_0: Decimal = Decimal("0")
    compras_tarifa_12: Decimal = Decimal("0")
    compras_tarifa_15: Decimal = Decimal("0")
    compras_no_objeto_iva: Decimal = Decimal("0")
    retenciones_iva_30: Decimal = Decimal("0")
    retenciones_iva_70: Decimal = Decimal("0")
    retenciones_iva_100: Decimal = Decimal("0")
    credito_tributario_mes_anterior: Decimal = Decimal("0")
    periodo: str = "MM-YYYY"
    tipo_declaracion: TipoDeclaracion = TipoDeclaracion.MENSUAL


class IVACalculationResult(BaseModel):
    """Resultado del cálculo de IVA."""
    iva_ventas_tarifa_12: Decimal
    iva_ventas_tarifa_15: Decimal
    total_iva_ventas: Decimal
    iva_compras_tarifa_12: Decimal
    iva_compras_tarifa_15: Decimal
    total_iva_compras: Decimal
    total_retenciones_iva: Decimal
    iva_bruto_a_pagar: Decimal
    credito_tributario_total: Decimal
    iva_a_pagar: Decimal
    detalle: Dict[str, Decimal]


def calcular_iva(
    base_imponible: Decimal,
    porcentaje: Decimal
) -> Decimal:
    """Calcula el IVA sobre una base imponible.
    IVA = BaseImponible * (porcentaje / 100)
    """
    rate = porcentaje / Decimal("100")
    iva = base_imponible * rate
    return iva.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class IVAEngine:
    """Motor de cálculo del IVA ecuatoriano."""

    TARIFA_12 = Decimal("12")
    TARIFA_15 = Decimal("15")
    TARIFA_0 = Decimal("0")

    def __init__(self, use_tarifa_15: bool = True):
        self.use_tarifa_15 = use_tarifa_15

    def get_active_rates(self) -> List[Tuple[str, Decimal]]:
        """Retorna las tarifas activas según configuración."""
        rates = [("0%", self.TARIFA_0), ("12%", self.TARIFA_12)]
        if self.use_tarifa_15:
            rates.append(("15%", self.TARIFA_15))
        return rates

    def calculate_iva_ventas(
        self,
        ventas_12: Decimal,
        ventas_15: Decimal
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Calcula IVA generado en ventas.
        Returns: (iva_12, iva_15, total)
        """
        iva_12 = calcular_iva(ventas_12, self.TARIFA_12)
        iva_15 = calcular_iva(ventas_15, self.TARIFA_15)
        total = iva_12 + iva_15
        return iva_12, iva_15, total

    def calculate_iva_compras(
        self,
        compras_12: Decimal,
        compras_15: Decimal
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Calcula IVA pagado en compras (crédito tributario).
        Returns: (iva_12, iva_15, total)
        """
        iva_12 = calcular_iva(compras_12, self.TARIFA_12)
        iva_15 = calcular_iva(compras_15, self.TARIFA_15)
        total = iva_12 + iva_15
        return iva_12, iva_15, total

    def calculate_retenciones_iva(
        self,
        ret_30: Decimal,
        ret_70: Decimal,
        ret_100: Decimal
    ) -> Decimal:
        """Calcula total de retenciones de IVA realizadas al contribuyente.
        Retención IVA 30% = IVA * 0.30
        Retención IVA 70% = IVA * 0.70
        Retención IVA 100% = IVA * 1.00
        """
        total = ret_30 + ret_70 + ret_100
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def calculate(
        self,
        input_data: IVACalculationInput
    ) -> IVACalculationResult:
        """Realiza el cálculo completo de IVA mensual.
        IVA a Pagar = IVA Ventas - (IVA Compras + Retenciones + Crédito Anterior)
        Si el resultado es negativo, es crédito tributario para el próximo mes.
        """
        # IVA Ventas
        iva_v12, iva_v15, total_iva_ventas = self.calculate_iva_ventas(
            input_data.ventas_tarifa_12,
            input_data.ventas_tarifa_15
        )

        # IVA Compras (crédito tributario)
        iva_c12, iva_c15, total_iva_compras = self.calculate_iva_compras(
            input_data.compras_tarifa_12,
            input_data.compras_tarifa_15
        )

        # Retenciones
        total_retenciones = self.calculate_retenciones_iva(
            input_data.retenciones_iva_30,
            input_data.retenciones_iva_70,
            input_data.retenciones_iva_100
        )

        # Crédito tributario total
        credito_total = (
            total_iva_compras
            + total_retenciones
            + input_data.credito_tributario_mes_anterior
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # IVA bruto a pagar (antes de crédito)
        iva_bruto = total_iva_ventas

        # IVA neto a pagar
        iva_a_pagar = (total_iva_ventas - credito_total).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        if iva_a_pagar < Decimal("0"):
            iva_a_pagar = Decimal("0")

        detalle = {
            "ventas_tarifa_0": input_data.ventas_tarifa_0,
            "ventas_tarifa_12": input_data.ventas_tarifa_12,
            "ventas_tarifa_15": input_data.ventas_tarifa_15,
            "exportaciones": input_data.exportaciones,
            "compras_tarifa_0": input_data.compras_tarifa_0,
            "compras_tarifa_12": input_data.compras_tarifa_12,
            "compras_tarifa_15": input_data.compras_tarifa_15,
            "credito_tributario_mes_anterior": input_data.credito_tributario_mes_anterior,
        }

        return IVACalculationResult(
            iva_ventas_tarifa_12=iva_v12,
            iva_ventas_tarifa_15=iva_v15,
            total_iva_ventas=total_iva_ventas,
            iva_compras_tarifa_12=iva_c12,
            iva_compras_tarifa_15=iva_c15,
            total_iva_compras=total_iva_compras,
            total_retenciones_iva=total_retenciones,
            iva_bruto_a_pagar=iva_bruto,
            credito_tributario_total=credito_total,
            iva_a_pagar=iva_a_pagar,
            detalle=detalle,
        )

    def generate_form104(
        self,
        form: Formulario104
    ) -> Formulario104Resultado:
        """Genera el Formulario 104 completo con cálculos."""
        input_data = IVACalculationInput(
            ventas_tarifa_0=form.ventas_tarifa_0,
            ventas_tarifa_12=form.ventas_tarifa_12,
            ventas_tarifa_15=form.ventas_tarifa_15,
            ventas_no_objeto_iva=form.ventas_no_objeto_iva,
            exportaciones=form.exportaciones,
            compras_tarifa_0=form.compras_tarifa_0,
            compras_tarifa_12=form.compras_tarifa_12,
            compras_tarifa_15=form.compras_tarifa_15,
            compras_no_objeto_iva=form.compras_no_objeto_iva,
            retenciones_iva_30=form.retenciones_iva_30,
            retenciones_iva_70=form.retenciones_iva_70,
            retenciones_iva_100=form.retenciones_iva_100,
            credito_tributario_mes_anterior=form.credito_tributario_mes_anterior,
            periodo=form.periodo_fiscal,
            tipo_declaracion=form.tipo_declaracion,
        )
        calc = self.calculate(input_data)

        subtotal = calc.iva_bruto_a_pagar
        valor_pagar = calc.iva_a_pagar
        total_con_multa = valor_pagar + form.multa + form.interes

        return Formulario104Resultado(
            form104=form,
            iva_ventas_tarifa_12=calc.iva_ventas_tarifa_12,
            iva_ventas_tarifa_15=calc.iva_ventas_tarifa_15,
            total_iva_ventas=calc.total_iva_ventas,
            iva_compras_tarifa_12=calc.iva_compras_tarifa_12,
            iva_compras_tarifa_15=calc.iva_compras_tarifa_15,
            total_iva_compras=calc.total_iva_compras,
            total_retenciones_iva=calc.total_retenciones_iva,
            subtotal_iva_a_pagar=subtotal,
            credito_tributario_total=calc.credito_tributario_total,
            valor_a_pagar=valor_pagar,
            total_con_multa_intereses=total_con_multa,
        )

    def monthly_summary(
        self,
        ventas_por_tarifa: Dict[str, Decimal],
        compras_por_tarifa: Dict[str, Decimal],
        retenciones_periodo: Dict[str, Decimal],
        credito_anterior: Decimal = Decimal("0")
    ) -> Dict:
        """Genera un resumen mensual de IVA."""
        engine = IVAEngine()
        input_data = IVACalculationInput(
            ventas_tarifa_0=ventas_por_tarifa.get("0%", Decimal("0")),
            ventas_tarifa_12=ventas_por_tarifa.get("12%", Decimal("0")),
            ventas_tarifa_15=ventas_por_tarifa.get("15%", Decimal("0")),
            compras_tarifa_0=compras_por_tarifa.get("0%", Decimal("0")),
            compras_tarifa_12=compras_por_tarifa.get("12%", Decimal("0")),
            compras_tarifa_15=compras_por_tarifa.get("15%", Decimal("0")),
            retenciones_iva_30=retenciones_periodo.get("30%", Decimal("0")),
            retenciones_iva_70=retenciones_periodo.get("70%", Decimal("0")),
            retenciones_iva_100=retenciones_periodo.get("100%", Decimal("0")),
            credito_tributario_mes_anterior=credito_anterior,
        )
        return self.calculate(input_data).model_dump()
