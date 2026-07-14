import type { RetencionSRI, ICEProducto, CalendarioSri, Provincia } from "./types"

export const PROVINCIAS: Provincia[] = [
  { codigo: "01", nombre: "Azuay" },
  { codigo: "02", nombre: "Bolívar" },
  { codigo: "03", nombre: "Cañar" },
  { codigo: "04", nombre: "Carchi" },
  { codigo: "05", nombre: "Cotopaxi" },
  { codigo: "06", nombre: "Chimborazo" },
  { codigo: "07", nombre: "El Oro" },
  { codigo: "08", nombre: "Esmeraldas" },
  { codigo: "09", nombre: "Guayas" },
  { codigo: "10", nombre: "Imbabura" },
  { codigo: "11", nombre: "Loja" },
  { codigo: "12", nombre: "Los Ríos" },
  { codigo: "13", nombre: "Manabí" },
  { codigo: "14", nombre: "Morona Santiago" },
  { codigo: "15", nombre: "Napo" },
  { codigo: "16", nombre: "Pastaza" },
  { codigo: "17", nombre: "Pichincha" },
  { codigo: "18", nombre: "Tungurahua" },
  { codigo: "19", nombre: "Zamora Chinchipe" },
  { codigo: "20", nombre: "Galápagos" },
  { codigo: "21", nombre: "Sucumbíos" },
  { codigo: "22", nombre: "Orellana" },
  { codigo: "23", nombre: "Santo Domingo de los Tsáchilas" },
  { codigo: "24", nombre: "Santa Elena" },
]

export const RETENCIONES_SRI: RetencionSRI[] = [
  { codigo: "303", concepto: "Honorarios profesionales", porcentaje: 8, tipo: "servicios" },
  { codigo: "304", concepto: "Servicios predomina el intelecto", porcentaje: 8, tipo: "servicios" },
  { codigo: "307", concepto: "Servicios predomina la mano de obra", porcentaje: 2, tipo: "servicios" },
  { codigo: "308", concepto: "Servicios entre sociedades", porcentaje: 2, tipo: "servicios" },
  { codigo: "309", concepto: "Servicios de publicidad y comunicación", porcentaje: 2, tipo: "servicios" },
  { codigo: "310", concepto: "Servicios de transporte privado", porcentaje: 2, tipo: "servicios" },
  { codigo: "311", concepto: "Servicios de transporte público", porcentaje: 2, tipo: "servicios" },
  { codigo: "312", concepto: "Comisión y corretaje", porcentaje: 2, tipo: "servicios" },
  { codigo: "313", concepto: "Arrendamiento de bienes inmuebles", porcentaje: 8, tipo: "arriendo" },
  { codigo: "314", concepto: "Arrendamiento de bienes muebles", porcentaje: 8, tipo: "arriendo" },
  { codigo: "319", concepto: "Seguros y reaseguros", porcentaje: 2, tipo: "servicios" },
  { codigo: "320", concepto: "Intereses y comisiones financieras", porcentaje: 2, tipo: "servicios" },
  { codigo: "322", concepto: "Compra de bienes muebles", porcentaje: 1, tipo: "bienes" },
  { codigo: "323", concepto: "Compra de bienes inmuebles", porcentaje: 2, tipo: "bienes" },
  { codigo: "324", concepto: "Otras compras de bienes", porcentaje: 1, tipo: "bienes" },
  { codigo: "332", concepto: "Otras retenciones", porcentaje: 2, tipo: "servicios" },
  { codigo: "340", concepto: "Honorarios a extranjeros no residentes", porcentaje: 25, tipo: "servicios" },
  { codigo: "343", concepto: "Dividendos a personas naturales", porcentaje: 10, tipo: "servicios" },
  { codigo: "344", concepto: "Dividendos a sociedades", porcentaje: 10, tipo: "servicios" },
]

export const ICE_PRODUCTOS: ICEProducto[] = [
  { codigo: "01", producto: "Vehículos motorizados (hasta 3500cc)", categoria: "vehiculos", tasaAdValorem: 5, tasaEspecifica: 0 },
  { codigo: "02", producto: "Vehículos motorizados (3501-4000cc)", categoria: "vehiculos", tasaAdValorem: 15, tasaEspecifica: 0 },
  { codigo: "03", producto: "Vehículos motorizados (más de 4000cc)", categoria: "vehiculos", tasaAdValorem: 35, tasaEspecifica: 0 },
  { codigo: "04", producto: "Aviones, avionetas y helicópteros", categoria: "vehiculos", tasaAdValorem: 15, tasaEspecifica: 0 },
  { codigo: "05", producto: "Bebidas alcohólicas (cerveza)", categoria: "alcohol", tasaAdValorem: 40, tasaEspecifica: 12.50 },
  { codigo: "06", producto: "Bebidas alcohólicas (licores destilados)", categoria: "alcohol", tasaAdValorem: 40, tasaEspecifica: 15.00 },
  { codigo: "07", producto: "Cigarrillos (tabaco)", categoria: "cigarrillos", tasaAdValorem: 150, tasaEspecifica: 0.0016 },
  { codigo: "08", producto: "Perfumes y cosméticos importados", categoria: "cosmeticos", tasaAdValorem: 20, tasaEspecifica: 0 },
  { codigo: "09", producto: "Agua embotellada y bebidas no alcohólicas", categoria: "bebidas", tasaAdValorem: 10, tasaEspecifica: 0 },
  { codigo: "10", producto: "Fundas plásticas", categoria: "plasticos", tasaAdValorem: 100, tasaEspecifica: 0.02 },
]

export const CALENDARIO_SRI: Record<string, CalendarioSri> = {
  "1": { novenoDigito: 1, fechaPagoIva: 10, fechaPagoRetenciones: 10 },
  "2": { novenoDigito: 2, fechaPagoIva: 12, fechaPagoRetenciones: 12 },
  "3": { novenoDigito: 3, fechaPagoIva: 14, fechaPagoRetenciones: 14 },
  "4": { novenoDigito: 4, fechaPagoIva: 16, fechaPagoRetenciones: 16 },
  "5": { novenoDigito: 5, fechaPagoIva: 18, fechaPagoRetenciones: 18 },
  "6": { novenoDigito: 6, fechaPagoIva: 20, fechaPagoRetenciones: 20 },
  "7": { novenoDigito: 7, fechaPagoIva: 22, fechaPagoRetenciones: 22 },
  "8": { novenoDigito: 8, fechaPagoIva: 24, fechaPagoRetenciones: 24 },
  "9": { novenoDigito: 9, fechaPagoIva: 26, fechaPagoRetenciones: 26 },
  "0": { novenoDigito: 0, fechaPagoIva: 28, fechaPagoRetenciones: 28 },
}

export function getProvinciaByCodigo(codigo: string): Provincia | undefined {
  return PROVINCIAS.find((p) => p.codigo === codigo)
}

export function getProvinciaPorRuc(ruc: string): Provincia | undefined {
  const codigo = ruc.substring(0, 2)
  return getProvinciaByCodigo(codigo)
}

export function getRetencionByCodigo(codigo: string): RetencionSRI | undefined {
  return RETENCIONES_SRI.find((r) => r.codigo === codigo)
}

export function getRetencionByTipo(tipo: string): RetencionSRI[] {
  return RETENCIONES_SRI.filter((r) => r.tipo === tipo)
}

export function getICEPorProducto(codigo: string): ICEProducto | undefined {
  return ICE_PRODUCTOS.find((p) => p.codigo === codigo)
}

export function getICEPorCategoria(categoria: string): ICEProducto[] {
  return ICE_PRODUCTOS.filter((p) => p.categoria === categoria)
}
