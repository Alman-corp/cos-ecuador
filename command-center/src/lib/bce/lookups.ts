export interface TasaInteres {
  activa: number
  pasiva: number
  fecha: string
  fuente: string
}

export interface RiesgoPais {
  valor: number
  fecha: string
  fuente: string
}

export interface TipoCambio {
  usd: number
  referencia: string
  fecha: string
}

export const TASA_INTERES_REFERENCIAL: TasaInteres = {
  activa: 0.1183,
  pasiva: 0.0561,
  fecha: "2026-07-01",
  fuente: "BCE - Tasas de Interés Referenciales",
}

export const RIESGO_PAIS_EMBI: RiesgoPais = {
  valor: 1250,
  fecha: "2026-07-01",
  fuente: "BCE / JP Morgan EMBI Ecuador",
}

export const TIPO_CAMBIO_USD: TipoCambio = {
  usd: 1.0,
  referencia: "Dólar oficial Ecuador",
  fecha: "2000-01-09",
}

export function getTasaInteres(): TasaInteres {
  return { ...TASA_INTERES_REFERENCIAL }
}

export function getRiesgoPais(): RiesgoPais {
  return { ...RIESGO_PAIS_EMBI }
}

export function getTipoCambio(): TipoCambio {
  return { ...TIPO_CAMBIO_USD }
}
