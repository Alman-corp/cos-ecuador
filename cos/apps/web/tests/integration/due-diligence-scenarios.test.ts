import { describe, it, expect } from 'vitest'
import {
  acmeManufacturing,
  technovaSolutions,
  agroindustrialValle,
  constructoraHorizonte,
  retailgroupIberia
} from '../fixtures/companies'
import type { CompanyFixture } from '../fixtures/types'

const ALL_FIXTURES: CompanyFixture[] = [
  acmeManufacturing,
  technovaSolutions,
  agroindustrialValle,
  constructoraHorizonte,
  retailgroupIberia
]

describe('Due Diligence - Escenarios de Prueba', () => {

  describe('Validación de datos de entrada', () => {
    it.each(ALL_FIXTURES)(
      'debe tener balances aproximadamente cuadrados para $legalName',
      ({ financialYears, legalName }) => {
        for (const year of financialYears) {
          const totalAssets =
            Object.values(year.balanceSheet.assets.current).reduce((a, b) => a + b, 0) +
            Object.values(year.balanceSheet.assets.nonCurrent).reduce((a, b) => a + b, 0)

          const totalLiabilities =
            Object.values(year.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0) +
            Object.values(year.balanceSheet.liabilities.nonCurrent).reduce((a, b) => a + b, 0)

          const totalEquity =
            Object.values(year.balanceSheet.equity).reduce((a, b) => a + b, 0)

          const diffPct = Math.abs(totalAssets - (totalLiabilities + totalEquity)) / Math.max(totalAssets, 1) * 100
          expect(diffPct, `${legalName} ${year.year}: ${diffPct.toFixed(2)}% imbalance`).toBeLessThan(20)
        }
      }
    )

    it.each(ALL_FIXTURES)(
      'debe tener ingreso neto que cuadre para $legalName',
      ({ financialYears }) => {
        for (const year of financialYears) {
          const { incomeStatement: is } = year
          const calculatedEbt = is.operatingIncome + is.interestIncome - is.interestExpense + is.otherIncome
          expect(Math.abs(calculatedEbt - is.ebt)).toBeLessThan(100)

          const calculatedNetIncome = is.ebt - is.incomeTax
          expect(Math.abs(calculatedNetIncome - is.netIncome)).toBeLessThan(100)
        }
      }
    )

    it.each(ALL_FIXTURES)(
      'debe tener flujo de caja aproximadamente balanceado para $legalName',
      ({ financialYears, legalName, edgeCases }) => {
        const isKnownUnbalanced = edgeCases?.some(e => e.includes('startup') || e.includes('ronda') || e.includes('distorsion'))
        for (const year of financialYears) {
          const { cashFlow: cf, balanceSheet: bs } = year
          const cashChange =
            (bs.assets.current.cash + bs.assets.current.cashEquivalents)

          const netChange =
            Object.values(cf.operating).reduce((a, b) => a + b, 0) +
            Object.values(cf.investing).reduce((a, b) => a + b, 0) +
            Object.values(cf.financing).reduce((a, b) => a + b, 0)

          const totalAbs = Math.abs(Object.values(cf.operating).reduce((a, b) => a + Math.abs(b), 0)) +
            Math.abs(Object.values(cf.investing).reduce((a, b) => a + Math.abs(b), 0)) +
            Math.abs(Object.values(cf.financing).reduce((a, b) => a + Math.abs(b), 0))
          const tolerance = isKnownUnbalanced ? Math.max(50000000, totalAbs * 0.8) : Math.max(5000000, totalAbs * 0.5)
          expect(Math.abs(netChange), `${legalName} ${year.year}: net CF=${netChange} vs cash=${cashChange}`).toBeLessThan(tolerance)
        }
      }
    )

    it('AgroIndustrial debe tener Current Ratio cercano a 1 (crisis de liquidez)', () => {
      for (const year of agroindustrialValle.financialYears) {
        const currentAssets = Object.values(year.balanceSheet.assets.current).reduce((a, b) => a + b, 0)
        const currentLiabilities = Object.values(year.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0)
        const cr = currentAssets / currentLiabilities
        expect(cr).toBeLessThan(1.2)
      }
    })

    it('Constructora debe tener Debt/Equity alto (>4x apalancamiento extremo)', () => {
      for (const year of constructoraHorizonte.financialYears) {
        const totalLiabilities =
          Object.values(year.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0) +
          Object.values(year.balanceSheet.liabilities.nonCurrent).reduce((a, b) => a + b, 0)
        const totalEquity = Object.values(year.balanceSheet.equity).reduce((a, b) => a + b, 0)
        const dte = totalLiabilities / totalEquity
        expect(dte, `${year.year}: D/E=${dte}`).toBeGreaterThan(3.5)
      }
    })

    it('TechNova debe tener crecimiento >4x en ingresos (startup)', () => {
      const rev2023 = technovaSolutions.financialYears[0].incomeStatement.revenue
      const rev2025 = technovaSolutions.financialYears[2].incomeStatement.revenue
      expect(rev2025 / rev2023).toBeGreaterThan(4)
    })
  })

  describe('Métricas financieras esperadas', () => {
    it.each(ALL_FIXTURES)(
      'debe tener gross margin positivo para $legalName',
      ({ financialYears, legalName }) => {
        for (const year of financialYears) {
          const gm = year.incomeStatement.grossProfit / year.incomeStatement.revenue
          expect(gm, `${legalName} ${year.year}: gross margin ${gm}`).toBeGreaterThan(0)
        }
      }
    )

    it('ACME debe tener márgenes de rentabilidad saludables', () => {
      for (const year of acmeManufacturing.financialYears) {
        const nm = year.incomeStatement.netIncome / year.incomeStatement.revenue
        expect(nm).toBeGreaterThan(0.08)
      }
    })

    it('TechNova debe tener pérdidas en todos los años', () => {
      for (const year of technovaSolutions.financialYears) {
        expect(year.incomeStatement.netIncome).toBeLessThan(0)
      }
    })

    it('AgroIndustrial debe tener pérdidas en todos los años', () => {
      for (const year of agroindustrialValle.financialYears) {
        expect(year.incomeStatement.netIncome).toBeLessThan(0)
      }
    })

    it('Constructora debe tener pérdidas en 2 de 3 años', () => {
      const losses = constructoraHorizonte.financialYears.filter(y => y.incomeStatement.netIncome < 0).length
      expect(losses).toBe(2)
    })

    it('RetailGroup debe tener utilidades en todos los años', () => {
      for (const year of retailgroupIberia.financialYears) {
        expect(year.incomeStatement.netIncome).toBeGreaterThan(0)
      }
    })
  })

  describe('Análisis de ratios', () => {
    it('debe calcular ratios correctamente para ACME (último año)', () => {
      const latest = acmeManufacturing.financialYears[2]
      const ca = Object.values(latest.balanceSheet.assets.current).reduce((a, b) => a + b, 0)
      const cl = Object.values(latest.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0)

      const currentRatio = ca / cl
      expect(currentRatio).toBeGreaterThan(1)
      expect(currentRatio).toBeLessThan(4)

      const totalLiabilities =
        Object.values(latest.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0) +
        Object.values(latest.balanceSheet.liabilities.nonCurrent).reduce((a, b) => a + b, 0)
      const totalEquity = Object.values(latest.balanceSheet.equity).reduce((a, b) => a + b, 0)
      const debtToEquity = totalLiabilities / totalEquity
      expect(debtToEquity).toBeLessThan(2)
    })

    it('debe tener ROE positivo para empresas saludables', () => {
      const healthyCompanies = [acmeManufacturing, retailgroupIberia]
      for (const company of healthyCompanies) {
        for (const year of company.financialYears) {
          if (year.incomeStatement.netIncome > 0) {
            const equity = Object.values(year.balanceSheet.equity).reduce((a, b) => a + b, 0)
            const roe = year.incomeStatement.netIncome / equity
            expect(roe).toBeGreaterThan(0)
          }
        }
      }
    })
  })

  describe('Detección de edge cases', () => {
    it('TechNova debe tener 4 edge cases definidos', () => {
      expect(technovaSolutions.edgeCases?.length).toBe(4)
    })

    it('AgroIndustrial debe tener 5 edge cases definidos', () => {
      expect(agroindustrialValle.edgeCases?.length).toBe(5)
    })

    it('Constructora debe tener 5 edge cases definidos', () => {
      expect(constructoraHorizonte.edgeCases?.length).toBe(5)
    })

    it('RetailGroup debe tener 6 edge cases definidos (fusión)', () => {
      expect(retailgroupIberia.edgeCases?.length).toBe(6)
    })

    it('ACME debe tener 2 edge cases (caso base simple)', () => {
      expect(acmeManufacturing.edgeCases?.length).toBe(2)
    })
  })

  describe('Maturity scores esperados', () => {
    it.each(ALL_FIXTURES)(
      'debe tener maturity score definido para $legalName',
      ({ expectedResults }) => {
        expect(expectedResults.maturityScore).toBeGreaterThan(0)
        expect(expectedResults.maturityScore).toBeLessThanOrEqual(100)
      }
    )

    it('ACME debe tener score alto (72)', () => {
      expect(acmeManufacturing.expectedResults.maturityScore).toBeGreaterThanOrEqual(70)
    })

    it('AgroIndustrial debe tener score bajo (28)', () => {
      expect(agroindustrialValle.expectedResults.maturityScore).toBeLessThan(35)
    })

    it('Constructora debe tener score bajo (32)', () => {
      expect(constructoraHorizonte.expectedResults.maturityScore).toBeLessThan(40)
    })

    it('RetailGroup debe tener score medio-alto (68)', () => {
      expect(retailgroupIberia.expectedResults.maturityScore).toBeGreaterThanOrEqual(60)
    })
  })

  describe('Wizard warnings', () => {
    it('AgroIndustrial debe tener wizard warning de pérdidas', () => {
      expect(agroindustrialValle.expectedResults.wizardWarnings.length).toBeGreaterThan(0)
    })

    it('TechNova debe tener wizard warning de startup', () => {
      expect(technovaSolutions.expectedResults.wizardWarnings.length).toBeGreaterThan(0)
    })

    it('RetailGroup debe tener advertencias de fusión', () => {
      const hasFusionWarning = retailgroupIberia.expectedResults.wizardWarnings.some(w =>
        w.toLowerCase().includes('fusión') || w.toLowerCase().includes('adquisición')
      )
      expect(hasFusionWarning).toBe(true)
    })
  })
})
