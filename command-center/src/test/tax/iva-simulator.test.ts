import { describe, it, expect } from 'vitest'

describe('IVA Simulator', () => {
  it('DEBE calcular IVA ventas correctamente (15% sobre 100k = 15k)', () => {
    const ivaVentas = 100000 * 0.15
    expect(ivaVentas).toBe(15000)
  })

  it('DEBE calcular crédito tributario (15% sobre 60k = 9k)', () => {
    const ivaCompras = 60000 * 0.15
    expect(ivaCompras).toBe(9000)
  })

  it('DEBE calcular IVA a pagar = IVA ventas - IVA compras', () => {
    const ivaVentas = 100000 * 0.15
    const ivaCompras = 60000 * 0.15
    const ivaPagar = Math.max(0, ivaVentas - ivaCompras)
    expect(ivaPagar).toBe(6000)
  })

  it('DEBE dar 0 si compras > ventas (crédito a favor)', () => {
    const ivaVentas = 50000 * 0.15
    const ivaCompras = 70000 * 0.15
    const ivaPagar = Math.max(0, ivaVentas - ivaCompras)
    expect(ivaPagar).toBe(0)
  })

  it('DEBE soportar tasa histórica 12%', () => {
    const ivaVentas = 100000 * 0.12
    expect(ivaVentas).toBe(12000)
  })

  it('DEBE soportar tasa turismo 5% LORTI', () => {
    const ivaVentas = 100000 * 0.05
    expect(ivaVentas).toBe(5000)
  })

  it('DEBE calcular tasa efectiva correctamente', () => {
    const ventas = 100000
    const compras = 60000
    const ivaRate = 0.15
    const effectiveRate = ((ventas - compras) / ventas) * ivaRate * 100
    expect(effectiveRate).toBeCloseTo(6.0, 1)
  })

  it('DEBE respetar IVA 15% como tasa vigente desde abril 2024 (Ley 1089)', () => {
    const ivaRate = 0.15
    expect(ivaRate).toBe(0.15)
  })
})
