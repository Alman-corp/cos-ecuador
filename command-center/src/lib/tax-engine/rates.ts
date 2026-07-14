export interface IVARate {
  label: string
  rate: number
  applicability: string
}

export interface IncomeTaxRate {
  label: string
  rate: number
  type: "sociedad" | "persona"
  bracket?: { desde: number; hasta: number; impuesto: number; fraccionExcedente: number }
}

export interface WithholdingRate {
  label: string
  tipo: "bienes" | "servicios" | "honorarios" | "arriendo"
  rate: number
}

export interface ICERate {
  label: string
  category: string
  rateMin: number
  rateMax: number
}

export const IVA_RATES: IVARate[] = [
  { label: "General", rate: 0.15, applicability: "Transferencia de bienes y prestación de servicios gravados" },
  { label: "Alimentos y Salud", rate: 0.05, applicability: "Alimentos de primera necesidad, medicinas, salud" },
  { label: "Exportaciones", rate: 0.00, applicability: "Exportaciones de bienes y servicios" },
]

export const IR_SOCIEDADES_RATE = 0.25

export const IR_PERSONAS_BRACKETS: IncomeTaxRate[] = [
  { label: "Exento", rate: 0, type: "persona", bracket: { desde: 0, hasta: 12270, impuesto: 0, fraccionExcedente: 0 } },
  { label: "Rango 1", rate: 0.05, type: "persona", bracket: { desde: 12270, hasta: 16360, impuesto: 0, fraccionExcedente: 0.05 } },
  { label: "Rango 2", rate: 0.1, type: "persona", bracket: { desde: 16360, hasta: 20450, impuesto: 204.5, fraccionExcedente: 0.1 } },
  { label: "Rango 3", rate: 0.12, type: "persona", bracket: { desde: 20450, hasta: 24540, impuesto: 613.5, fraccionExcedente: 0.12 } },
  { label: "Rango 4", rate: 0.15, type: "persona", bracket: { desde: 24540, hasta: 32720, impuesto: 1104.3, fraccionExcedente: 0.15 } },
  { label: "Rango 5", rate: 0.2, type: "persona", bracket: { desde: 32720, hasta: 40900, impuesto: 2331.3, fraccionExcedente: 0.2 } },
  { label: "Rango 6", rate: 0.25, type: "persona", bracket: { desde: 40900, hasta: 49080, impuesto: 3967.3, fraccionExcedente: 0.25 } },
  { label: "Rango 7", rate: 0.3, type: "persona", bracket: { desde: 49080, hasta: 61350, impuesto: 6012.3, fraccionExcedente: 0.3 } },
  { label: "Rango 8", rate: 0.35, type: "persona", bracket: { desde: 61350, hasta: Infinity, impuesto: 9693.3, fraccionExcedente: 0.35 } },
]

export const WITHHOLDING_RATES: WithholdingRate[] = [
  { label: "Bienes", tipo: "bienes", rate: 0.01 },
  { label: "Servicios", tipo: "servicios", rate: 0.02 },
  { label: "Honorarios", tipo: "honorarios", rate: 0.08 },
  { label: "Arriendo", tipo: "arriendo", rate: 0.08 },
]

export const ICE_RATES: ICERate[] = [
  { label: "Vehículos", category: "vehiculos", rateMin: 0.05, rateMax: 0.35 },
  { label: "Bebidas Alcohólicas", category: "alcohol", rateMin: 0.40, rateMax: 0.75 },
  { label: "Cigarrillos", category: "cigarrillos", rateMin: 1.50, rateMax: 1.50 },
]

export const IESS_RATES = {
  personal: 0.0945,
  patronal: 0.1145,
}
