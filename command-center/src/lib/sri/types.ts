export interface Provincia {
  codigo: string
  nombre: string
}

export interface RetencionSRI {
  codigo: string
  concepto: string
  porcentaje: number
  tipo: "bienes" | "servicios" | "arriendo"
}

export interface ICEProducto {
  codigo: string
  producto: string
  categoria: string
  tasaAdValorem: number
  tasaEspecifica: number
}

export interface CalendarioSri {
  novenoDigito: number
  fechaPagoIva: number
  fechaPagoRetenciones: number
}

export interface Obligacion {
  id: string
  nombre: string
  formulario: string
  fechaVencimiento: Date
  periodo: string
  diasRestantes: number
}

export interface SriEngine {
  getProvincias(): Provincia[]
  getRetenciones(): RetencionSRI[]
  getICEPorductos(): ICEProducto[]
  getCalendario(): Record<string, CalendarioSri>
}
