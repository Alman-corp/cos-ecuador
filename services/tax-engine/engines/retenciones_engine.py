"""Motor de cálculo de Retenciones en la Fuente del Impuesto a la Renta.
Cátalogos SRI: 1%, 2%, 8%, 10%, 25% y retenciones de IVA 30%, 70%, 100%.
"""

from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class TipoRetencion(str, Enum):
    """Códigos SRI para retenciones en la fuente."""
    COMBUSTIBLES = "COMBUSTIBLES"
    BIENES_SOCIEDADES = "BIENES_SOCIEDADES"
    SEGUROS_REASEGUROS = "SEGUROS_REASEGUROS"
    HONORARIOS_PROFESIONALES = "HONORARIOS_PROFESIONALES"
    ARRIENDOS = "ARRIENDOS"
    SERVICIOS_EN_GENERAL = "SERVICIOS_EN_GENERAL"
    IMPUESTO_UNICO_HERENCIAS = "IMPUESTO_UNICO_HERENCIAS"
    RENDIMIENTOS_FINANCIEROS_PN = "RENDIMIENTOS_FINANCIEROS_PN"
    PAGOS_EXTERIOR = "PAGOS_EXTERIOR"
    SERVICIOS_OFFSHORE = "SERVICIOS_OFFSHORE"


class RetencionIVA(str, Enum):
    """Porcentajes de retención de IVA (agente de retención)."""
    IVA_30 = "30%"
    IVA_70 = "70%"
    IVA_100 = "100%"


class RetencionCatalogEntry(BaseModel):
    """Entrada del catálogo de retenciones SRI."""
    codigo: str
    tipo: str
    porcentaje: Decimal
    descripcion: str
    base_minima: Decimal = Decimal("0")
    aplica_a: str = ""


class RetencionCalculationInput(BaseModel):
    """Entrada para cálculo de retención en la fuente."""
    tipo: TipoRetencion
    base_imponible: Decimal = Field(..., max_digits=14, decimal_places=2)
    porcentaje_personalizado: Optional[Decimal] = None
    sujeto_pasivo: str = Field(..., description="RUC o cédula del sujeto retenido")
    ejercicio_fiscal: int = 2025
    es_agente_retencion: bool = True
    retencion_iva_tipo: Optional[RetencionIVA] = None
    base_iva: Optional[Decimal] = None


class RetencionCalculationResult(BaseModel):
    """Resultado del cálculo de retención."""
    tipo: TipoRetencion
    base_imponible: Decimal
    porcentaje_aplicado: Decimal
    valor_retenido: Decimal
    retencion_iva_valor: Optional[Decimal] = None
    total_retenido: Decimal
    descripcion: str
    codigo_sri: str


# Catálogo SRI de retenciones en la fuente
CATALOGO_RETENCIONES_SRI: List[RetencionCatalogEntry] = [
    RetencionCatalogEntry(
        codigo="304", tipo="BIENES",
        porcentaje=Decimal("1"),
        descripcion="Adquisición de bienes (sociedades)",
        aplica_a="SOCIEDADES"
    ),
    RetencionCatalogEntry(
        codigo="305", tipo="COMBUSTIBLES",
        porcentaje=Decimal("1"),
        descripcion="Combustibles",
        aplica_a="TODOS"
    ),
    RetencionCatalogEntry(
        codigo="306", tipo="SEGUROS",
        porcentaje=Decimal("1"),
        descripcion="Seguros y reaseguros",
        aplica_a="TODOS"
    ),
    RetencionCatalogEntry(
        codigo="307", tipo="HONORARIOS",
        porcentaje=Decimal("2"),
        descripcion="Honorarios profesionales",
        aplica_a="PERSONAS_NATURALES"
    ),
    RetencionCatalogEntry(
        codigo="308", tipo="ARRIENDOS",
        porcentaje=Decimal("2"),
        descripcion="Arrendamiento de bienes inmuebles",
        aplica_a="TODOS"
    ),
    RetencionCatalogEntry(
        codigo="309", tipo="SERVICIOS",
        porcentaje=Decimal("2"),
        descripcion="Servicios en general",
        aplica_a="TODOS"
    ),
    RetencionCatalogEntry(
        codigo="310", tipo="HERENCIAS",
        porcentaje=Decimal("8"),
        descripcion="Impuesto único a herencias, legados y donaciones",
        aplica_a="PERSONAS_NATURALES"
    ),
    RetencionCatalogEntry(
        codigo="311", tipo="FINANCIEROS",
        porcentaje=Decimal("10"),
        descripcion="Rendimientos financieros (personas naturales)",
        aplica_a="PERSONAS_NATURALES"
    ),
    RetencionCatalogEntry(
        codigo="312", tipo="EXTERIOR",
        porcentaje=Decimal("25"),
        descripcion="Pagos al exterior",
        aplica_a="TODOS"
    ),
    RetencionCatalogEntry(
        codigo="313", tipo="OFFSHORE",
        porcentaje=Decimal("25"),
        descripcion="Servicios offshore",
        aplica_a="TODOS"
    ),
]


class RetencionesEngine:
    """Motor de cálculo de retenciones en la fuente del Impuesto a la Renta."""

    # Porcentajes por tipo
    PORCENTAJES: Dict[TipoRetencion, Decimal] = {
        TipoRetencion.COMBUSTIBLES: Decimal("1"),
        TipoRetencion.BIENES_SOCIEDADES: Decimal("1"),
        TipoRetencion.SEGUROS_REASEGUROS: Decimal("1"),
        TipoRetencion.HONORARIOS_PROFESIONALES: Decimal("2"),
        TipoRetencion.ARRIENDOS: Decimal("2"),
        TipoRetencion.SERVICIOS_EN_GENERAL: Decimal("2"),
        TipoRetencion.IMPUESTO_UNICO_HERENCIAS: Decimal("8"),
        TipoRetencion.RENDIMIENTOS_FINANCIEROS_PN: Decimal("10"),
        TipoRetencion.PAGOS_EXTERIOR: Decimal("25"),
        TipoRetencion.SERVICIOS_OFFSHORE: Decimal("25"),
    }

    # Códigos SRI
    CODIGOS_SRI: Dict[TipoRetencion, str] = {
        TipoRetencion.COMBUSTIBLES: "305",
        TipoRetencion.BIENES_SOCIEDADES: "304",
        TipoRetencion.SEGUROS_REASEGUROS: "306",
        TipoRetencion.HONORARIOS_PROFESIONALES: "307",
        TipoRetencion.ARRIENDOS: "308",
        TipoRetencion.SERVICIOS_EN_GENERAL: "309",
        TipoRetencion.IMPUESTO_UNICO_HERENCIAS: "310",
        TipoRetencion.RENDIMIENTOS_FINANCIEROS_PN: "311",
        TipoRetencion.PAGOS_EXTERIOR: "312",
        TipoRetencion.SERVICIOS_OFFSHORE: "313",
    }

    # IVA retención: 30%, 70%, 100% del IVA
    PORCENTAJES_IVA: Dict[RetencionIVA, Decimal] = {
        RetencionIVA.IVA_30: Decimal("30"),
        RetencionIVA.IVA_70: Decimal("70"),
        RetencionIVA.IVA_100: Decimal("100"),
    }

    def get_catalog(self) -> List[RetencionCatalogEntry]:
        """Retorna el catálogo completo de retenciones SRI."""
        return CATALOGO_RETENCIONES_SRI

    def calculate(
        self,
        input_data: RetencionCalculationInput
    ) -> RetencionCalculationResult:
        """Calcula el valor de retención en la fuente.
        Valor Retenido = Base Imponible * (Porcentaje / 100)
        """
        porcentaje = (
            input_data.porcentaje_personalizado
            if input_data.porcentaje_personalizado is not None
            else self.PORCENTAJES[input_data.tipo]
        )

        valor_retenido = (
            input_data.base_imponible * porcentaje / Decimal("100")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        retencion_iva_valor = None
        if input_data.retencion_iva_tipo and input_data.base_iva is not None:
            pct_iva = self.PORCENTAJES_IVA[input_data.retencion_iva_tipo]
            iva_calculado = input_data.base_iva * Decimal("12") / Decimal("100")
            retencion_iva_valor = (
                iva_calculado * pct_iva / Decimal("100")
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        total = valor_retenido
        if retencion_iva_valor:
            total += retencion_iva_valor

        entry = next(
            (e for e in CATALOGO_RETENCIONES_SRI if e.codigo == self.CODIGOS_SRI[input_data.tipo]),
            None
        )
        descripcion = entry.descripcion if entry else input_data.tipo.value

        return RetencionCalculationResult(
            tipo=input_data.tipo,
            base_imponible=input_data.base_imponible,
            porcentaje_aplicado=porcentaje,
            valor_retenido=valor_retenido,
            retencion_iva_valor=retencion_iva_valor,
            total_retenido=total,
            descripcion=descripcion,
            codigo_sri=self.CODIGOS_SRI[input_data.tipo],
        )

    def validate_retencion(
        self,
        base: Decimal,
        porcentaje: Decimal,
        valor_retenido: Decimal
    ) -> bool:
        """Valida que el valor retenido corresponda al porcentaje legal."""
        esperado = (base * porcentaje / Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        return valor_retenido == esperado
