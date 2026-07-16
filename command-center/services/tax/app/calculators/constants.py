from decimal import Decimal
from enum import Enum


class IVATariff(str, Enum):
    CERO = "0%"
    CINCO = "5%"
    DOCE = "12%"
    QUINCE = "15%"
    EXENTO = "EXENTO"
    NO_OBJETO = "NO_OBJETO"


IVA_RATES = {
    IVATariff.CERO: Decimal("0.00"),
    IVATariff.CINCO: Decimal("0.05"),
    IVATariff.DOCE: Decimal("0.12"),
    IVATariff.QUINCE: Decimal("0.15"),
    IVATariff.EXENTO: Decimal("0.00"),
    IVATariff.NO_OBJETO: Decimal("0.00"),
}


class RetencionType(str, Enum):
    HONORARIOS_PROFESIONALES = "HONORARIOS"
    SERVICIOS_PERSONALES = "SERV_PERSONALES"
    SERVICIOS_NO_PERSONALES = "SERV_NO_PERSONAL"
    ARRENDAMIENTO_MERCANTIL = "ARR_MERCANTIL"
    ARRENDAMIENTO_INMUEBLES = "ARR_INMUEBLES"
    UTILIZACION_APROVECHAMIENTO = "UTILIZACION"
    PUBLICIDAD = "PUBLICIDAD"
    COMISIONES = "COMISIONES"
    PROMOCION = "PROMOCION"
    TRANSFERENCIA_BIENES = "TRANSFERENCIA"
    OTROS_BIENES = "OTROS_BIENES"
    COMBUSTIBLES = "COMBUSTIBLES"
    SEGUROS = "SEGUROS"
    RENDIMIENTOS_FINANCIEROS = "REND_FINANCIEROS"
    LOTERIAS_RIFAS = "LOTERIAS"


RETENCION_RATES_BIENES: dict[RetencionType, Decimal] = {
    RetencionType.TRANSFERENCIA_BIENES: Decimal("0.01"),
    RetencionType.OTROS_BIENES: Decimal("0.01"),
    RetencionType.COMBUSTIBLES: Decimal("0.01"),
    RetencionType.PUBLICIDAD: Decimal("0.01"),
    RetencionType.PROMOCION: Decimal("0.01"),
    RetencionType.SERVICIOS_NO_PERSONALES: Decimal("0.01"),
    RetencionType.COMISIONES: Decimal("0.10"),
}

RETENCION_RATES_SERVICIOS: dict[RetencionType, Decimal] = {
    RetencionType.HONORARIOS_PROFESIONALES: Decimal("0.10"),
    RetencionType.SERVICIOS_PERSONALES: Decimal("0.10"),
    RetencionType.ARRENDAMIENTO_MERCANTIL: Decimal("0.08"),
    RetencionType.ARRENDAMIENTO_INMUEBLES: Decimal("0.08"),
    RetencionType.UTILIZACION_APROVECHAMIENTO: Decimal("0.08"),
    RetencionType.SEGUROS: Decimal("0.01"),
    RetencionType.RENDIMIENTOS_FINANCIEROS: Decimal("0.02"),
    RetencionType.LOTERIAS_RIFAS: Decimal("0.15"),
}


class IVARetentionType(str, Enum):
    NO_AGENTE = "NO_AGENTE"
    AGENTE_30 = "AGENTE_30"
    AGENTE_70 = "AGENTE_70"
    AGENTE_100 = "AGENTE_100"


IVA_RETENTION_RATES = {
    IVARetentionType.NO_AGENTE: Decimal("0.00"),
    IVARetentionType.AGENTE_30: Decimal("0.30"),
    IVARetentionType.AGENTE_70: Decimal("0.70"),
    IVARetentionType.AGENTE_100: Decimal("1.00"),
}


class RentTaxRate(str, Enum):
    PERSONAS_NATURALES_OBLIGADAS = "PN_OBLIGADAS"
    PERSONAS_NATURALES_NO_OBLIGADAS = "PN_NO_OBLIGADAS"
    SOCIEDADES = "SOCIEDADES"
    MICROEMPRESAS_RIMPE = "RIMPE"
    BANCA_PRIVADA = "BANCA_PRIVADA"
    DESARROLLO_POPULAR = "DESARROLLO_POPULAR"


RENTA_RATES = {
    RentTaxRate.PERSONAS_NATURALES_OBLIGADAS: Decimal("0.25"),
    RentTaxRate.SOCIEDADES: Decimal("0.25"),
    RentTaxRate.MICROEMPRESAS_RIMPE: Decimal("0.02"),
    RentTaxRate.BANCA_PRIVADA: Decimal("0.28"),
    RentTaxRate.DESARROLLO_POPULAR: Decimal("0.02"),
}

TABLA_PROGRESIVA_PN_2024 = [
    (Decimal("11535"), Decimal("0.00"), Decimal("0")),
    (Decimal("16480"), Decimal("0.05"), Decimal("577")),
    (Decimal("25720"), Decimal("0.10"), Decimal("1401")),
    (Decimal("35720"), Decimal("0.12"), Decimal("2325")),
    (Decimal("46720"), Decimal("0.15"), Decimal("3525")),
    (Decimal("63720"), Decimal("0.20"), Decimal("6125")),
    (Decimal("91120"), Decimal("0.25"), Decimal("10525")),
    (Decimal("120160"), Decimal("0.30"), Decimal("16525")),
    (Decimal("999999999"), Decimal("0.35"), Decimal("25237")),
]

FRACCION_BASICA_PN = Decimal("11535")
ANTICIPO_RENTA_PCT = Decimal("0.33")

COMPROBANTE_CODES = {
    "01": "Factura", "03": "Liquidación de Compras", "04": "Nota de Crédito",
    "05": "Nota de Débito", "06": "Póliza", "13": "Comprobante de Retención",
}

FRACCION_BASICA_SBU = Decimal("470")
MULTAS = {
    "declaracion_tardia_mes": FRACCION_BASICA_SBU * Decimal("0.05"),
    "declaracion_tardia_anual": FRACCION_BASICA_SBU * Decimal("0.09"),
    "anexo_tardio": FRACCION_BASICA_SBU * Decimal("0.03"),
    "omision_ingresos": Decimal("0.20"),
}
