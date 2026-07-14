export interface InflacionAnual {
  valor: number
  periodo: string
  fuente: string
}

export interface CanastaBasica {
  valor: number
  ingresoFamiliar: number
  canastaVital: number
  periodo: string
  fuente: string
}

export interface SBU {
  valor: number
  vigencia: string
  fuente: string
}

export const INPC_ANUAL: InflacionAnual = {
  valor: 2.61,
  periodo: "2026-06",
  fuente: "INEC - Índice de Precios al Consumidor (variación anual)",
}

export const CANASTA_BASICA_FAMILIAR: CanastaBasica = {
  valor: 788.44,
  ingresoFamiliar: 525.00,
  canastaVital: 588.12,
  periodo: "2026-06",
  fuente: "INEC - Canasta Básica Familiar",
}

export const SBU_ACTUAL: SBU = {
  valor: 480,
  vigencia: "2026-01-01",
  fuente: "Ministerio del Trabajo - Salario Básico Unificado",
}

export function getInflacion(): InflacionAnual {
  return { ...INPC_ANUAL }
}

export function getCanastaBasica(): CanastaBasica {
  return { ...CANASTA_BASICA_FAMILIAR }
}

export function getSBU(): SBU {
  return { ...SBU_ACTUAL }
}
