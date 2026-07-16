from decimal import Decimal, ROUND_HALF_UP
from typing import List
from pydantic import BaseModel, Field
from datetime import date
from .constants import RetencionType, RETENCION_RATES_BIENES, RETENCION_RATES_SERVICIOS


class RetencionInput(BaseModel):
    invoice_number: str
    invoice_date: date
    supplier_ruc: str
    supplier_name: str
    retencion_type: RetencionType
    base_imponible: Decimal
    iva_amount: Decimal = Field(default=Decimal("0"))
    es_relacionado: bool = False
    es_exterior: bool = False
    aplica_paraiso_fiscal: bool = False


class RetencionOutput(BaseModel):
    invoice_number: str
    supplier_ruc: str
    supplier_name: str
    retencion_type: RetencionType
    base_imponible: Decimal
    porcentaje: Decimal
    valor_retenido: Decimal
    fecha_emision_comprobante: date


class RetencionesResult(BaseModel):
    retenciones: List[RetencionOutput]
    total_retenido: Decimal
    total_base: Decimal
    conteo_por_tipo: dict
    formulario_103_lineas: dict


class RetencionesCalculator:
    @staticmethod
    def calculate(retenciones: List[RetencionInput]) -> RetencionesResult:
        outputs: List[RetencionOutput] = []
        conteo_por_tipo = {}
        total_retenido = Decimal("0")
        total_base = Decimal("0")

        for r in retenciones:
            if r.retencion_type in RETENCION_RATES_BIENES:
                porcentaje = RETENCION_RATES_BIENES[r.retencion_type]
            elif r.retencion_type in RETENCION_RATES_SERVICIOS:
                porcentaje = RETENCION_RATES_SERVICIOS[r.retencion_type]
            else:
                porcentaje = Decimal("0.01")

            if r.es_exterior:
                porcentaje = max(porcentaje, Decimal("0.22"))
            if r.aplica_paraiso_fiscal:
                porcentaje = Decimal("0.35")

            valor_retenido = (r.base_imponible * porcentaje).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            outputs.append(RetencionOutput(
                invoice_number=r.invoice_number, supplier_ruc=r.supplier_ruc,
                supplier_name=r.supplier_name, retencion_type=r.retencion_type,
                base_imponible=r.base_imponible, porcentaje=porcentaje,
                valor_retenido=valor_retenido, fecha_emision_comprobante=r.invoice_date,
            ))

            total_retenido += valor_retenido
            total_base += r.base_imponible
            tipo_str = r.retencion_type.value
            conteo_por_tipo[tipo_str] = conteo_por_tipo.get(tipo_str, 0) + 1

        formulario_103_lineas = {}
        for r in outputs:
            casilla_key = f"casilla_{r.retencion_type.value[:3]}_{r.fecha_emision_comprobante.month}"
            formulario_103_lineas[casilla_key] = formulario_103_lineas.get(casilla_key, Decimal("0")) + r.valor_retenido

        return RetencionesResult(
            retenciones=outputs, total_retenido=total_retenido,
            total_base=total_base, conteo_por_tipo=conteo_por_tipo,
            formulario_103_lineas=formulario_103_lineas,
        )
