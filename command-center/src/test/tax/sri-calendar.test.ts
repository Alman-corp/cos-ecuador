import { describe, it, expect } from 'vitest'
import { getClientCalendar, validateRUCEcuador } from '@/lib/tax/sri-calendar'

describe('SRI Calendar', () => {
  it('DEBE generar 30 obligaciones para un año completo', () => {
    const cal = getClientCalendar('1790000002001', 'Test SA', 1, 2026)
    expect(cal.obligations).toHaveLength(30)
  })

  it('DEBE incluir IVA mensual + retenciones (24 obligaciones)', () => {
    const cal = getClientCalendar('1790000002001', 'Test SA', 1, 2026)
    const ivaObligations = cal.obligations.filter(o => o.type === 'IVA_MONTHLY')
    const retentionObligations = cal.obligations.filter(o => o.type === 'RETENTION_AT_SOURCE')
    expect(ivaObligations).toHaveLength(12)
    expect(retentionObligations).toHaveLength(12)
  })

  it('DEBE incluir 4 anexos ATS trimestrales', () => {
    const cal = getClientCalendar('1790000002001', 'Test SA', 5, 2026)
    const ats = cal.obligations.filter(o => o.type === 'ATS_ANNEX')
    expect(ats).toHaveLength(4)
  })

  it('DEBE incluir Impuesto a la Renta anual', () => {
    const cal = getClientCalendar('1790000002001', 'Test SA', 5, 2026)
    const annualTax = cal.obligations.find(o => o.type === 'INCOME_TAX_ANNUAL')
    expect(annualTax).toBeDefined()
    expect(annualTax!.sriForm).toBe('Formulario 101')
  })

  it('DEBE calcular vencimientos según noveno dígito (1→día 10)', () => {
    const cal = getClientCalendar('1790000002001', 'Test SA', 1, 2026)
    const firstIva = cal.obligations.find(o => o.type === 'IVA_MONTHLY' && o.period === '2026-01')
    const dueDay = new Date(firstIva!.dueDate).getDate()
    expect(dueDay).toBe(10)
  })

  it('DEBE calcular vencimiento noveno dígito 9→día 26', () => {
    const cal = getClientCalendar('1790000002009', 'Test SA', 9, 2026)
    const firstIva = cal.obligations.find(o => o.type === 'IVA_MONTHLY' && o.period === '2026-01')
    const dueDay = new Date(firstIva!.dueDate).getDate()
    expect(dueDay).toBe(26)
  })

  it('DEBE ordenar obligaciones por fecha de vencimiento', () => {
    const cal = getClientCalendar('1790000002001', 'Test SA', 1, 2026)
    for (let i = 1; i < cal.obligations.length; i++) {
      const prev = new Date(cal.obligations[i - 1].dueDate).getTime()
      const curr = new Date(cal.obligations[i].dueDate).getTime()
      expect(curr).toBeGreaterThanOrEqual(prev)
    }
  })

  it('DEBE calcular summary correctamente', () => {
    const cal = getClientCalendar('1790000002001', 'Test SA', 1, 2026)
    expect(cal.summary.total).toBe(30)
    expect(cal.summary.pending + cal.summary.overdue + cal.summary.completed).toBe(30)
  })
})

describe('RUC Validation', () => {
  it('DEBE validar RUC correcto 1790000002001', () => {
    const result = validateRUCEcuador('1790000002001')
    expect(result.valid).toBe(true)
    expect(result.ninthDigit).toBe(0)
    expect(result.provincia).toBe('Pichincha')
  })

  it('DEBE validar RUC correcto 1710034065001', () => {
    const result = validateRUCEcuador('1710034065001')
    expect(result.valid).toBe(true)
    expect(result.ninthDigit).toBe(6)
    expect(result.provincia).toBe('Pichincha')
  })

  it('DEBE rechazar RUC con provincia inválida', () => {
    const result = validateRUCEcuador('2590000002001')
    expect(result.valid).toBe(false)
  })

  it('DEBE rechazar RUC con menos de 13 dígitos', () => {
    const result = validateRUCEcuador('179000000200')
    expect(result.valid).toBe(false)
  })

  it('DEBE rechazar RUC con dígito verificador incorrecto (cambiar position 9)', () => {
    const result = validateRUCEcuador('1790000003001')
    expect(result.valid).toBe(false)
  })

  it('DEBE rechazar RUC con caracteres no numéricos', () => {
    const result = validateRUCEcuador('1790000002a01')
    expect(result.valid).toBe(false)
  })

  it('DEBE identificar provincia Guayas para RUC 09x', () => {
    const result = validateRUCEcuador('0900029356001')
    expect(result.valid).toBe(true)
    expect(result.provincia).toBe('Guayas')
  })

  it('DEBE identificar provincia Azuay para RUC 01x', () => {
    const result = validateRUCEcuador('0100042829001')
    expect(result.valid).toBe(true)
    expect(result.provincia).toBe('Azuay')
  })
})
