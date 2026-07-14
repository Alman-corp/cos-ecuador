import { CALENDARIO_SRI } from "./lookups"
import type { Obligacion } from "./types"

const DIAS_POR_MES: Record<number, number> = {
  "1": 31, "2": 28, "3": 31, "4": 30, "5": 31, "6": 30,
  "7": 31, "8": 31, "9": 30, "10": 31, "11": 30, "12": 31,
}

function esBisiesto(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function ultimoDiaMes(mes: number, year: number): number {
  if (mes === 2 && esBisiesto(year)) return 29
  return DIAS_POR_MES[mes] ?? 30
}

export function getVencimiento(mes: number, digito: number): Date {
  const now = new Date()
  const year = mes <= now.getMonth() + 1 ? now.getFullYear() : now.getFullYear()

  const entry = Object.values(CALENDARIO_SRI).find((c) => c.novenoDigito === digito)
  const day = entry?.fechaPagoIva ?? 28

  const dueMonth = mes + 1 > 12 ? 1 : mes + 1
  const dueYear = mes + 1 > 12 ? year + 1 : year
  const clampedDay = Math.min(day, ultimoDiaMes(dueMonth, dueYear))

  return new Date(dueYear, dueMonth - 1, clampedDay)
}

export function getVencimientoRetenciones(mes: number, digito: number): Date {
  const now = new Date()
  const year = mes <= now.getMonth() + 1 ? now.getFullYear() : now.getFullYear()

  const entry = Object.values(CALENDARIO_SRI).find((c) => c.novenoDigito === digito)
  const day = entry?.fechaPagoRetenciones ?? 28

  const dueMonth = mes + 1 > 12 ? 1 : mes + 1
  const dueYear = mes + 1 > 12 ? year + 1 : year
  const clampedDay = Math.min(day, ultimoDiaMes(dueMonth, dueYear))

  return new Date(dueYear, dueMonth - 1, clampedDay)
}

function calcularDiasRestantes(fecha: Date): number {
  const ahora = new Date()
  const diff = fecha.getTime() - ahora.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getProximasObligaciones(tenantRuc: string): Obligacion[] {
  const novenoDigito = parseInt(tenantRuc[8], 10)
  const ahora = new Date()
  const mesActual = ahora.getMonth() + 1
  const yearActual = ahora.getFullYear()
  const obligaciones: Obligacion[] = []

  for (let offset = 0; offset < 3; offset++) {
    const mes = mesActual + offset > 12 ? mesActual + offset - 12 : mesActual + offset
    const year = mesActual + offset > 12 ? yearActual + 1 : yearActual

    const vencIva = getVencimiento(mes, novenoDigito)
    const vencRet = getVencimientoRetenciones(mes, novenoDigito)

    obligaciones.push({
      id: `iva-${year}-${mes}`,
      nombre: `Declaración IVA Mes ${mes}`,
      formulario: "104",
      fechaVencimiento: vencIva,
      periodo: `${year}-${String(mes).padStart(2, "0")}`,
      diasRestantes: calcularDiasRestantes(vencIva),
    })

    obligaciones.push({
      id: `ret-${year}-${mes}`,
      nombre: `Declaración Retenciones en la Fuente Mes ${mes}`,
      formulario: "103",
      fechaVencimiento: vencRet,
      periodo: `${year}-${String(mes).padStart(2, "0")}`,
      diasRestantes: calcularDiasRestantes(vencRet),
    })
  }

  return obligaciones
}

export function getDiasRestantes(obligacion: Obligacion): number {
  return calcularDiasRestantes(obligacion.fechaVencimiento)
}
