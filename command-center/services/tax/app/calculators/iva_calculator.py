from decimal import Decimal, ROUND_HALF_UP
from typing import List
from pydantic import BaseModel, Field
from .constants import IVATariff, IVA_RATES, IVARetentionType, IVA_RETENTION_RATES


class InvoiceItem(BaseModel):
    invoice_number: str
    date: str
    ruc_supplier: str
    base_0: Decimal = Field(default=Decimal("0"))
    base_5: Decimal = Field(default=Decimal("0"))
    base_12: Decimal = Field(default=Decimal("0"))
    base_15: Decimal = Field(default=Decimal("0"))
    base_exempt: Decimal = Field(default=Decimal("0"))
    base_no_object: Decimal = Field(default=Decimal("0"))
    ice: Decimal = Field(default=Decimal("0"))


class IVACalculationInput(BaseModel):
    tenant_id: str
    client_ruc: str
    fiscal_period: str
    sales: List[InvoiceItem]
    purchases: List[InvoiceItem]
    iva_retention_received: List[dict] = Field(default_factory=list)
    iva_retention_withheld: List[dict] = Field(default_factory=list)
    saldo_favor_anterior: Decimal = Field(default=Decimal("0"))
    ice_total: Decimal = Field(default=Decimal("0"))


class IVAResult(BaseModel):
    ingresos_base_0: Decimal
    ingresos_base_5: Decimal
    ingresos_base_12: Decimal
    ingresos_base_15: Decimal
    ingresos_exemptos: Decimal
    ingresos_no_objeto: Decimal
    ingresos_totales: Decimal
    iva_cobrado_5: Decimal
    iva_cobrado_12: Decimal
    iva_cobrado_15: Decimal
    iva_cobrado_total: Decimal
    iva_pagado_0: Decimal
    iva_pagado_5: Decimal
    iva_pagado_12: Decimal
    iva_pagado_15: Decimal
    iva_pagado_total: Decimal
    retenciones_iva_recibidas: Decimal
    retenciones_iva_pagadas: Decimal
    ice_a_pagar: Decimal
    iva_diferencia: Decimal
    iva_neto: Decimal
    saldo_a_pagar: Decimal
    saldo_a_favor: Decimal
    lineas_formulario: dict
    warnings: List[str]


class IVACalculator:
    @staticmethod
    def calculate(input_data: IVACalculationInput) -> IVAResult:
        warnings = []

        ingresos_base_0 = sum(s.base_0 for s in input_data.sales)
        ingresos_base_5 = sum(s.base_5 for s in input_data.sales)
        ingresos_base_12 = sum(s.base_12 for s in input_data.sales)
        ingresos_base_15 = sum(s.base_15 for s in input_data.sales)
        ingresos_exemptos = sum(s.base_exempt for s in input_data.sales)
        ingresos_no_objeto = sum(s.base_no_object for s in input_data.sales)
        ingresos_totales = ingresos_base_0 + ingresos_base_5 + ingresos_base_12 + ingresos_base_15 + ingresos_exemptos + ingresos_no_objeto

        iva_cobrado_5 = (ingresos_base_5 * IVA_RATES[IVATariff.CINCO]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        iva_cobrado_12 = (ingresos_base_12 * IVA_RATES[IVATariff.DOCE]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        iva_cobrado_15 = (ingresos_base_15 * IVA_RATES[IVATariff.QUINCE]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        iva_cobrado_total = iva_cobrado_5 + iva_cobrado_12 + iva_cobrado_15

        iva_pagado_5 = sum(p.base_5 * IVA_RATES[IVATariff.CINCO] for p in input_data.purchases).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        iva_pagado_12 = sum(p.base_12 * IVA_RATES[IVATariff.DOCE] for p in input_data.purchases).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        iva_pagado_15 = sum(p.base_15 * IVA_RATES[IVATariff.QUINCE] for p in input_data.purchases).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        iva_pagado_total = iva_pagado_5 + iva_pagado_12 + iva_pagado_15

        if iva_pagado_total > iva_cobrado_total * Decimal("1.5") and iva_cobrado_total > 0:
            warnings.append(f"Crédito tributario (${iva_pagado_total}) excede 150% del IVA cobrado (${iva_cobrado_total}). Alerta SRI.")

        retenciones_iva_recibidas = Decimal("0")
        for ret in input_data.iva_retention_received:
            rate = IVA_RETENTION_RATES.get(IVARetentionType(ret.get("retention_type", "NO_AGENTE")), Decimal("0"))
            retenciones_iva_recibidas += (Decimal(str(ret.get("iva_amount", 0))) * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        retenciones_iva_pagadas = Decimal("0")
        for ret in input_data.iva_retention_withheld:
            rate = IVA_RETENTION_RATES.get(IVARetentionType(ret.get("retention_type", "NO_AGENTE")), Decimal("0"))
            retenciones_iva_pagadas += (Decimal(str(ret.get("iva_amount", 0))) * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        iva_diferencia = iva_cobrado_total - iva_pagado_total
        iva_neto = iva_diferencia + retenciones_iva_recibidas - retenciones_iva_pagadas
        iva_neto_con_anterior = iva_neto - input_data.saldo_favor_anterior

        if iva_neto_con_anterior >= 0:
            saldo_a_pagar = iva_neto_con_anterior
            saldo_a_favor = Decimal("0")
        else:
            saldo_a_pagar = Decimal("0")
            saldo_a_favor = abs(iva_neto_con_anterior)

        lineas_formulario = {
            "casilla_301": ingresos_base_0, "casilla_302": ingresos_base_5,
            "casilla_303": ingresos_base_12, "casilla_304": ingresos_base_15,
            "casilla_307": ingresos_exemptos, "casilla_308": ingresos_no_objeto,
            "casilla_309": ingresos_totales,
            "casilla_401": iva_cobrado_5, "casilla_402": iva_cobrado_12,
            "casilla_403": iva_cobrado_15, "casilla_409": iva_cobrado_total,
            "casilla_501": iva_pagado_5, "casilla_502": iva_pagado_12,
            "casilla_503": iva_pagado_15, "casilla_509": iva_pagado_total,
            "casilla_604": retenciones_iva_recibidas, "casilla_605": retenciones_iva_pagadas,
            "casilla_701": input_data.ice_total, "casilla_702": input_data.saldo_favor_anterior,
            "casilla_721": iva_diferencia, "casilla_731": saldo_a_pagar, "casilla_732": saldo_a_favor,
        }

        return IVAResult(
            ingresos_base_0=ingresos_base_0, ingresos_base_5=ingresos_base_5,
            ingresos_base_12=ingresos_base_12, ingresos_base_15=ingresos_base_15,
            ingresos_exemptos=ingresos_exemptos, ingresos_no_objeto=ingresos_no_objeto,
            ingresos_totales=ingresos_totales,
            iva_cobrado_5=iva_cobrado_5, iva_cobrado_12=iva_cobrado_12,
            iva_cobrado_15=iva_cobrado_15, iva_cobrado_total=iva_cobrado_total,
            iva_pagado_0=Decimal("0"), iva_pagado_5=iva_pagado_5,
            iva_pagado_12=iva_pagado_12, iva_pagado_15=iva_pagado_15,
            iva_pagado_total=iva_pagado_total,
            retenciones_iva_recibidas=retenciones_iva_recibidas,
            retenciones_iva_pagadas=retenciones_iva_pagadas,
            ice_a_pagar=input_data.ice_total,
            iva_diferencia=iva_diferencia, iva_neto=iva_neto,
            saldo_a_pagar=saldo_a_pagar, saldo_a_favor=saldo_a_favor,
            lineas_formulario=lineas_formulario, warnings=warnings,
        )
