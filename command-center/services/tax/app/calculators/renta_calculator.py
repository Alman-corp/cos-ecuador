from decimal import Decimal, ROUND_HALF_UP
from typing import List
from pydantic import BaseModel, Field
from .constants import RentTaxRate, RENTA_RATES, TABLA_PROGRESIVA_PN_2024, ANTICIPO_RENTA_PCT


class IngresosAnuales(BaseModel):
    ingresos_gravados: Decimal
    ingresos_exemptos: Decimal = Decimal("0")
    ingresos_no_objeto: Decimal = Decimal("0")


class GastosAnuales(BaseModel):
    costos_ventas: Decimal = Decimal("0")
    gastos_operativos: Decimal = Decimal("0")
    gastos_administrativos: Decimal = Decimal("0")
    gastos_financieros: Decimal = Decimal("0")
    sueldos_salarios: Decimal = Decimal("0")
    beneficios_empleados: Decimal = Decimal("0")
    depreciacion: Decimal = Decimal("0")
    amortizacion: Decimal = Decimal("0")
    gastos_no_deducibles: Decimal = Decimal("0")
    provision_incobrables: Decimal = Decimal("0")


class RentaInput(BaseModel):
    tenant_id: str
    client_ruc: str
    fiscal_year: int
    tipo_contribuyente: RentTaxRate
    ingresos: IngresosAnuales
    gastos: GastosAnuales
    retenciones_ir_recibidas: Decimal = Decimal("0")
    pagos_provisionales: Decimal = Decimal("0")
    anticipo_anterior: Decimal = Decimal("0")
    perdidas_arrastre: Decimal = Decimal("0")
    donaciones_deducibles: Decimal = Decimal("0")


class RentaResult(BaseModel):
    ingresos_totales: Decimal
    ingresos_gravados: Decimal
    ingresos_exemptos: Decimal
    costos_deducibles: Decimal
    gastos_deducibles: Decimal
    total_deducciones: Decimal
    utilidad_bruta: Decimal
    participacion_trabajadores: Decimal
    utilidad_antes_impuestos: Decimal
    conciliacion_fiscal_positiva: Decimal
    conciliacion_fiscal_negativa: Decimal
    base_imponible: Decimal
    impuesto_causado: Decimal
    menos_pagos_provisionales: Decimal
    menos_retenciones_recibidas: Decimal
    menos_anticipo: Decimal
    impuesto_a_pagar: Decimal
    impuesto_a_favor: Decimal
    anticipo_proximo_anio: Decimal
    tabla_progresiva_aplicada: bool
    fraccion_basica: Decimal
    excedente: Decimal
    lineas_formulario: dict
    warnings: List[str]


class RentaCalculator:
    @staticmethod
    def calculate(input_data: RentaInput) -> RentaResult:
        warnings = []

        ingresos_totales = input_data.ingresos.ingresos_gravados + input_data.ingresos.ingresos_exemptos + input_data.ingresos.ingresos_no_objeto

        costos_deducibles = input_data.gastos.costos_ventas
        gastos_deducibles = (
            input_data.gastos.gastos_operativos + input_data.gastos.gastos_administrativos +
            input_data.gastos.gastos_financieros + input_data.gastos.sueldos_salarios +
            input_data.gastos.beneficios_empleados + input_data.gastos.depreciacion +
            input_data.gastos.amortizacion + input_data.gastos.provision_incobrables +
            input_data.donaciones_deducibles
        )
        total_deducciones = costos_dedicibles + gastos_deducibles if False else costos_deducibles + gastos_deducibles

        if ingresos_totales > 0 and total_deducciones / ingresos_totales > Decimal("0.85"):
            warnings.append(f"Gastos deducibles ({total_deducciones / ingresos_totales:.1%} de ingresos) exceden umbral. SRI puede auditar.")

        utilidad_bruta = ingresos_totales - total_deducciones

        if utilidad_bruta > 0 and input_data.tipo_contribuyente != RentTaxRate.PERSONAS_NATURALES_NO_OBLIGADAS:
            participacion_trabajadores = (utilidad_bruta * Decimal("0.15")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            participacion_trabajadores = Decimal("0")

        utilidad_antes_impuestos = utilidad_bruta - participacion_trabajadores

        conciliacion_fiscal_positiva = input_data.gastos.gastos_no_deducibles
        conciliacion_fiscal_negativa = input_data.ingresos.ingresos_exemptos

        base_imponible = utilidad_antes_impuestos + conciliacion_fiscal_positiva - conciliacion_fiscal_negativa - input_data.perdidas_arrastre
        base_imponible = max(base_imponible, Decimal("0"))

        tabla_progresiva_aplicada = False
        fraccion_basica = Decimal("0")
        excedente = Decimal("0")

        if input_data.tipo_contribuyente == RentTaxRate.PERSONAS_NATURALES_NO_OBLIGADAS:
            tabla_progresiva_aplicada = True
            impuesto_causado = RentaCalculator._calcular_tabla_progresiva(base_imponible)
            for i, (limite, pct, deduccion) in enumerate(TABLA_PROGRESIVA_PN_2024):
                if base_imponible <= limite:
                    fraccion_basica = TABLA_PROGRESIVA_PN_2024[max(0, i - 1)][0] if i > 0 else Decimal("0")
                    excedente = base_imponible - fraccion_basica
                    break
        else:
            tasa = RENTA_RATES[input_data.tipo_contribuyente]
            impuesto_causado = (base_imponible * tasa).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        impuesto_neto = impuesto_causado - input_data.pagos_provisionales - input_data.retenciones_ir_recibidas - input_data.anticipo_anterior

        if impuesto_neto >= 0:
            impuesto_a_pagar = impuesto_neto
            impuesto_a_favor = Decimal("0")
        else:
            impuesto_a_pagar = Decimal("0")
            impuesto_a_favor = abs(impuesto_neto)

        anticipo_proximo_anio = (impuesto_causado * ANTICIPO_RENTA_PCT).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        lineas_formulario = {
            "casilla_101": ingresos_totales, "casilla_105": input_data.ingresos.ingresos_gravados,
            "casilla_106": input_data.ingresos.ingresos_exemptos,
            "casilla_201": costos_deducibles, "casilla_202": gastos_deducibles,
            "casilla_299": total_deducciones, "casilla_301": utilidad_bruta,
            "casilla_303": participacion_trabajadores, "casilla_304": utilidad_antes_impuestos,
            "casilla_320": conciliacion_fiscal_positiva, "casilla_330": conciliacion_fiscal_negativa,
            "casilla_341": input_data.perdidas_arrastre, "casilla_345": base_imponible,
            "casilla_401": impuesto_causado, "casilla_452": input_data.pagos_provisionales,
            "casilla_455": input_data.retenciones_ir_recibidas, "casilla_456": input_data.anticipo_anterior,
            "casilla_499": impuesto_a_pagar, "casilla_500": impuesto_a_favor,
            "casilla_700": anticipo_proximo_anio,
        }

        return RentaResult(
            ingresos_totales=ingresos_totales, ingresos_gravados=input_data.ingresos.ingresos_gravados,
            ingresos_exemptos=input_data.ingresos.ingresos_exemptos,
            costos_deducibles=costos_deducibles, gastos_deducibles=gastos_deducibles,
            total_deducciones=total_deducciones, utilidad_bruta=utilidad_bruta,
            participacion_trabajadores=participacion_trabajadores,
            utilidad_antes_impuestos=utilidad_antes_impuestos,
            conciliacion_fiscal_positiva=conciliacion_fiscal_positiva,
            conciliacion_fiscal_negativa=conciliacion_fiscal_negativa,
            base_imponible=base_imponible, impuesto_causado=impuesto_causado,
            menos_pagos_provisionales=input_data.pagos_provisionales,
            menos_retenciones_recibidas=input_data.retenciones_ir_recibidas,
            menos_anticipo=input_data.anticipo_anterior,
            impuesto_a_pagar=impuesto_a_pagar, impuesto_a_favor=impuesto_a_favor,
            anticipo_proximo_anio=anticipo_proximo_anio,
            tabla_progresiva_aplicada=tabla_progresiva_aplicada,
            fraccion_basica=fraccion_basica, excedente=excedente,
            lineas_formulario=lineas_formulario, warnings=warnings,
        )

    @staticmethod
    def _calcular_tabla_progresiva(base_imponible: Decimal) -> Decimal:
        for limite, tasa, deduccion in TABLA_PROGRESIVA_PN_2024:
            if base_imponible <= limite:
                impuesto = (base_imponible * tasa) - deduccion
                return max(impuesto.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), Decimal("0"))
        return Decimal("0")
