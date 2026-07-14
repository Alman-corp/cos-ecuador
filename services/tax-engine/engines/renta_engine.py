"""Motor de cálculo del Impuesto a la Renta.
Personas Jurídicas: 28% (incluye 3% anticipo).
Personas Naturales: tabla progresiva 2025/2026.
Gastos personales deducibles con topes.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple
from pydantic import BaseModel, Field
from enum import Enum
from datetime import date


class TipoContribuyenteRenta(str, Enum):
    PERSONA_NATURAL = "PERSONA_NATURAL"
    SOCIEDAD = "SOCIEDAD"


class RentaBracket(BaseModel):
    """Tramo del impuesto a la renta progresivo."""
    fraccion_basica: Decimal
    impuesto_fraccion_basica: Decimal
    porcentaje_exceso: Decimal
    limite_superior: Decimal = Decimal("999999999999.99")


# Tabla de IR Personas Naturales 2025/2026
TABLA_IR_PERSONAS_NATURALES: List[RentaBracket] = [
    RentaBracket(fraccion_basica=Decimal("0"), impuesto_fraccion_basica=Decimal("0"), porcentaje_exceso=Decimal("0"), limite_superior=Decimal("11270")),
    RentaBracket(fraccion_basica=Decimal("11270"), impuesto_fraccion_basica=Decimal("0"), porcentaje_exceso=Decimal("5"), limite_superior=Decimal("14180")),
    RentaBracket(fraccion_basica=Decimal("14180"), impuesto_fraccion_basica=Decimal("145.50"), porcentaje_exceso=Decimal("10"), limite_superior=Decimal("18180")),
    RentaBracket(fraccion_basica=Decimal("18180"), impuesto_fraccion_basica=Decimal("545.50"), porcentaje_exceso=Decimal("12"), limite_superior=Decimal("21640")),
    RentaBracket(fraccion_basica=Decimal("21640"), impuesto_fraccion_basica=Decimal("960.70"), porcentaje_exceso=Decimal("15"), limite_superior=Decimal("31640")),
    RentaBracket(fraccion_basica=Decimal("31640"), impuesto_fraccion_basica=Decimal("2460.70"), porcentaje_exceso=Decimal("20"), limite_superior=Decimal("41640")),
    RentaBracket(fraccion_basica=Decimal("41640"), impuesto_fraccion_basica=Decimal("4460.70"), porcentaje_exceso=Decimal("25"), limite_superior=Decimal("53640")),
    RentaBracket(fraccion_basica=Decimal("53640"), impuesto_fraccion_basica=Decimal("7460.70"), porcentaje_exceso=Decimal("30"), limite_superior=Decimal("63640")),
    RentaBracket(fraccion_basica=Decimal("63640"), impuesto_fraccion_basica=Decimal("10460.70"), porcentaje_exceso=Decimal("35"), limite_superior=Decimal("103640")),
    RentaBracket(fraccion_basica=Decimal("103640"), impuesto_fraccion_basica=Decimal("24460.70"), porcentaje_exceso=Decimal("37"), limite_superior=Decimal("999999999999.99")),
]


# Topes de gastos personales deducibles 2025/2026
GASTOS_PERSONALES_TOPE: Dict[str, Decimal] = {
    "vivienda": Decimal("7733"),
    "educacion": Decimal("7733"),
    "salud": Decimal("7733"),
    "alimentacion": Decimal("7733"),
    "vestimenta": Decimal("7733"),
    "turismo": Decimal("7733"),
}

TOTAL_GASTOS_TOPE: Decimal = Decimal("15467")


class GastosPersonalesInput(BaseModel):
    """Gastos personales deducibles del contribuyente."""
    vivienda: Decimal = Decimal("0")
    educacion: Decimal = Decimal("0")
    salud: Decimal = Decimal("0")
    alimentacion: Decimal = Decimal("0")
    vestimenta: Decimal = Decimal("0")
    turismo: Decimal = Decimal("0")


class PersonalRentaInput(BaseModel):
    """Entrada para cálculo de IR de persona natural."""
    ingresos_anuales: Decimal = Field(..., max_digits=14, decimal_places=2)
    gastos_personales: GastosPersonalesInput = Field(default_factory=GastosPersonalesInput)
    aportes_seguridad_social: Decimal = Decimal("0")
    deducciones_adicionales: Decimal = Decimal("0")
    ejercicio_fiscal: int = 2025
    numero_dependientes: int = 0


class CorporateRentaInput(BaseModel):
    """Entrada para cálculo de IR de sociedad."""
    ingresos_anuales: Decimal = Field(..., max_digits=14, decimal_places=2)
    costos_gastos_deducibles: Decimal = Decimal("0")
    gastos_no_deducibles: Decimal = Decimal("0")
    ingreso_anterior_ejercicio: Decimal | None = None
    ejercicio_fiscal: int = 2025


class RentaCalculationResult(BaseModel):
    """Resultado del cálculo de Impuesto a la Renta."""
    model_config = {"arbitrary_types_allowed": True}
    tipo_contribuyente: TipoContribuyenteRenta
    ingresos_anuales: Decimal
    base_imponible: Decimal
    deducciones_totales: Decimal
    impuesto_causado: Decimal
    total_a_pagar: Decimal
    anticipo_proximo_anio: Decimal | None = None
    detalle: dict[str, Decimal]
    tramos_aplicados: list = []


class AnticipoInput(BaseModel):
    """Entrada para cálculo de anticipo de IR."""
    impuesto_causado_anio_anterior: Decimal
    ingresos_anuales: Decimal
    activo_real: Decimal = Decimal("0")
    gastos_deducibles: Decimal = Decimal("0")


class RentRates(BaseModel):
    """Tarifas vigentes del Impuesto a la Renta."""
    tarifa_sociedades: Decimal = Decimal("28")
    anticipo_porcentaje: Decimal = Decimal("3")
    tabla_personal: List[RentaBracket] = TABLA_IR_PERSONAS_NATURALES
    descripcion: str = "Tarifas IR Ecuador 2025/2026"


class RentaEngine:
    """Motor de cálculo del Impuesto a la Renta ecuatoriano."""

    TASA_SOCIEDADES = Decimal("28")
    ANTICIPO_PORCENTAJE = Decimal("3")

    def get_tables(self) -> RentRates:
        """Retorna las tablas vigentes de IR."""
        return RentRates()

    def calculate_personal(
        self,
        input_data: PersonalRentaInput
    ) -> RentaCalculationResult:
        """Calcula el IR para persona natural usando la tabla progresiva.
        Base Imponible = Ingresos - (Gastos Personales Deducibles + Aportes IESS + Otras Deducciones)
        Impuesto = Suma de tramos progresivos
        """
        gastos = input_data.gastos_personales
        gastos_deducibles = sum([
            min(gastos.vivienda, GASTOS_PERSONALES_TOPE["vivienda"]),
            min(gastos.educacion, GASTOS_PERSONALES_TOPE["educacion"]),
            min(gastos.salud, GASTOS_PERSONALES_TOPE["salud"]),
            min(gastos.alimentacion, GASTOS_PERSONALES_TOPE["alimentacion"]),
            min(gastos.vestimenta, GASTOS_PERSONALES_TOPE["vestimenta"]),
            min(gastos.turismo, GASTOS_PERSONALES_TOPE["turismo"]),
        ], Decimal("0"))

        gastos_deducibles = min(gastos_deducibles, TOTAL_GASTOS_TOPE)
        total_deducciones = (
            gastos_deducibles
            + input_data.aportes_seguridad_social
            + input_data.deducciones_adicionales
        )

        base_imponible = (
            input_data.ingresos_anuales - total_deducciones
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if base_imponible < Decimal("0"):
            base_imponible = Decimal("0")

        # Aplicar tabla progresiva
        impuesto = Decimal("0")
        tramos_aplicados = []

        for bracket in TABLA_IR_PERSONAS_NATURALES:
            if base_imponible <= bracket.fraccion_basica:
                continue
            if base_imponible <= bracket.limite_superior:
                exceso = base_imponible - bracket.fraccion_basica
                impuesto = bracket.impuesto_fraccion_basica + exceso * bracket.porcentaje_exceso / Decimal("100")
                tramos_aplicados.append({
                    "tramo": f"${bracket.fraccion_basica:,.2f} - ${base_imponible:,.2f}",
                    "porcentaje": float(bracket.porcentaje_exceso),
                    "impuesto_tramo": float(impuesto),
                })
                break

        impuesto = impuesto.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        detalle = {
            "ingresos_anuales": input_data.ingresos_anuales,
            "gastos_personales_deducibles": gastos_deducibles,
            "aportes_iess": input_data.aportes_seguridad_social,
            "deducciones_adicionales": input_data.deducciones_adicionales,
            "total_deducciones": total_deducciones,
            "base_imponible": base_imponible,
        }

        return RentaCalculationResult(
            tipo_contribuyente=TipoContribuyenteRenta.PERSONA_NATURAL,
            ingresos_anuales=input_data.ingresos_anuales,
            base_imponible=base_imponible,
            deducciones_totales=total_deducciones,
            impuesto_causado=impuesto,
            total_a_pagar=impuesto,
            detalle=detalle,
            tramos_aplicados=tramos_aplicados,
        )

    def calculate_corporate(
        self,
        input_data: CorporateRentaInput
    ) -> RentaCalculationResult:
        """Calcula el IR para sociedades (28%).
        Base Imponible = Ingresos - Gastos Deducibles + Gastos No Deducibles
        Impuesto = Base Imponible * 28%
        Anticipo = Impuesto * 3% (para próximo año)
        """
        base_imponible = (
            input_data.ingresos_anuales
            - input_data.costos_gastos_deducibles
            + input_data.gastos_no_deducibles
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if base_imponible < Decimal("0"):
            base_imponible = Decimal("0")

        impuesto = (
            base_imponible * self.TASA_SOCIEDADES / Decimal("100")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        anticipo = impuesto

        detalle = {
            "ingresos_anuales": input_data.ingresos_anuales,
            "costos_gastos_deducibles": input_data.costos_gastos_deducibles,
            "gastos_no_deducibles": input_data.gastos_no_deducibles,
            "base_imponible": base_imponible,
            "tasa_aplicada": self.TASA_SOCIEDADES,
            "anticipo_porcentaje": self.ANTICIPO_PORCENTAJE,
        }

        return RentaCalculationResult(
            tipo_contribuyente=TipoContribuyenteRenta.SOCIEDAD,
            ingresos_anuales=input_data.ingresos_anuales,
            base_imponible=base_imponible,
            deducciones_totales=input_data.costos_gastos_deducibles,
            impuesto_causado=impuesto,
            total_a_pagar=impuesto,
            anticipo_proximo_anio=anticipo,
            detalle=detalle,
        )

    def calculate_anticipo(
        self,
        input_data: AnticipoInput
    ) -> Dict:
        """Calcula el anticipo de IR.
        Anticipo = 3% de (Impuesto Causado Año Anterior + Ingresos + Activo Real + Gastos) / 4
        """
        base_anticipo = (
            input_data.impuesto_causado_anio_anterior
            + input_data.ingresos_anuales
            + input_data.activo_real
            + input_data.gastos_deducibles
        ) / Decimal("4")

        anticipo = (
            base_anticipo * self.ANTICIPO_PORCENTAJE / Decimal("100")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return {
            "impuesto_causado_anterior": float(input_data.impuesto_causado_anio_anterior),
            "ingresos_anuales": float(input_data.ingresos_anuales),
            "activo_real": float(input_data.activo_real),
            "gastos_deducibles": float(input_data.gastos_deducibles),
            "base_anticipo": float(base_anticipo),
            "porcentaje": float(self.ANTICIPO_PORCENTAJE),
            "anticipo_calculado": float(anticipo),
        }
