import { describe, it, expect } from "vitest"
import { getVencimiento, getVencimientoRetenciones, getDiasRestantes } from "@/lib/sri/calendario"
import type { Obligacion } from "@/lib/sri/types"

describe("getVencimiento", () => {
  it("returns correct date for digito 1 (paga el 10)", () => {
    const result = getVencimiento(1, 1)
    expect(result.getDate()).toBe(10)
  })

  it("returns correct date for digito 9 (paga el 26)", () => {
    const result = getVencimiento(1, 9)
    expect(result.getDate()).toBe(26)
  })

  it("returns correct date for digito 0 (paga el 28)", () => {
    const result = getVencimiento(1, 0)
    expect(result.getDate()).toBe(28)
  })

  it("handles December -> January rollover", () => {
    const result = getVencimiento(12, 1)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(10)
  })

  it("handles digito 6 (paga el 20)", () => {
    const result = getVencimiento(3, 6)
    expect(result.getDate()).toBe(20)
  })
})

describe("getVencimientoRetenciones", () => {
  it("returns same day pattern as IVA for retenciones", () => {
    const result = getVencimientoRetenciones(1, 3)
    expect(result.getDate()).toBe(14)
  })
})

describe("getDiasRestantes", () => {
  it("returns 0 for past dates", () => {
    const past = new Date("2020-01-01")
    const obligacion: Obligacion = {
      id: "test",
      nombre: "Test",
      formulario: "104",
      fechaVencimiento: past,
      periodo: "2020-01",
      diasRestantes: 0,
    }
    expect(getDiasRestantes(obligacion)).toBe(0)
  })

  it("returns positive number for future dates", () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    const obligacion: Obligacion = {
      id: "test",
      nombre: "Test",
      formulario: "104",
      fechaVencimiento: future,
      periodo: "2025-01",
      diasRestantes: 0,
    }
    expect(getDiasRestantes(obligacion)).toBeGreaterThan(0)
  })
})
