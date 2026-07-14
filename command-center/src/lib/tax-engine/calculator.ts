import { IVA_RATES, IR_SOCIEDADES_RATE, IR_PERSONAS_BRACKETS, WITHHOLDING_RATES } from "./rates"

export interface VATResult {
  ivaGenerado: number
  ivaCredito: number
  ivaAPagar: number
}

export interface IncomeTaxResult {
  baseImponible: number
  tarifa: number
  impuestoCasilla: number
}

export function calculateVAT(ingresosGravados: number, creditosTributarios: number, tasa: number = 0.15): VATResult {
  const ivaGenerado = ingresosGravados * tasa
  const ivaAPagar = Math.max(0, ivaGenerado - creditosTributarios)
  return { ivaGenerado, ivaCredito: creditosTributarios, ivaAPagar }
}

export function calculateIncomeTax(
  utilidadNeta: number,
  tipo: "sociedad" | "persona"
): IncomeTaxResult {
  if (tipo === "sociedad") {
    return {
      baseImponible: utilidadNeta,
      tarifa: IR_SOCIEDADES_RATE,
      impuestoCasilla: utilidadNeta * IR_SOCIEDADES_RATE,
    }
  }

  for (const b of IR_PERSONAS_BRACKETS) {
    if (!b.bracket) continue
    const { desde, hasta, impuesto, fraccionExcedente } = b.bracket
    if (utilidadNeta > desde && utilidadNeta <= hasta) {
      const excedente = utilidadNeta - desde
      const total = impuesto + excedente * fraccionExcedente
      return {
        baseImponible: utilidadNeta,
        tarifa: fraccionExcedente,
        impuestoCasilla: Math.round(total * 100) / 100,
      }
    }
  }

  return { baseImponible: utilidadNeta, tarifa: 0, impuestoCasilla: 0 }
}

export function calculateWithholding(
  monto: number,
  tipo: "bienes" | "servicios" | "honorarios" | "arriendo"
): number {
  const rate = WITHHOLDING_RATES.find((r) => r.tipo === tipo)
  return rate ? monto * rate.rate : 0
}
