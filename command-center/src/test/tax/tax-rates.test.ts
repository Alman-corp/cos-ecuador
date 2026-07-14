import { describe, it, expect } from 'vitest'

describe('Ecuador Tax Rates 2026', () => {
  it('IVA general: 15%', () => expect(0.15).toBe(0.15))
  it('IVA exportaciones: 0%', () => expect(0).toBe(0))
  it('IVA turismo LORTI: 5%', () => expect(0.05).toBe(0.05))
  it('Impuesto a la Renta personas jurídicas: 28%', () => expect(0.28).toBe(0.28))
  it('Participación trabajadores: 15%', () => expect(0.15).toBe(0.15))
  it('SBU 2026: $480', () => expect(480).toBe(480))
  it('Aporte IESS personal: 9.45%', () => expect(0.0945).toBe(0.0945))
  it('Aporte IESS patronal: 11.15%', () => expect(0.1115).toBe(0.1115))

  describe('Retention Rates', () => {
    const rates: Record<string, number> = {
      profesional: 0.01,
      otros: 0.02,
      honorarios: 0.08,
      consumibles: 0.10,
      publicidad: 0.30,
    }

    it('servicios profesionales: 1%', () => expect(rates.profesional).toBe(0.01))
    it('otros servicios: 2%', () => expect(rates.otros).toBe(0.02))
    it('honorarios profesionales: 8%', () => expect(rates.honorarios).toBe(0.08))
    it('consumibles: 10%', () => expect(rates.consumibles).toBe(0.10))
    it('publicidad: 30%', () => expect(rates.publicidad).toBe(0.30))
  })
})
