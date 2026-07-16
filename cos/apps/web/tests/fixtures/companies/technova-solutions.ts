import type { CompanyFixture } from '../types'

export const technovaSolutions: CompanyFixture = {
  id: 'company-technova-002',
  legalName: 'TechNova Solutions S.A. de C.V.',
  taxId: 'TNO210315HDFMCN09',
  country: 'MX',
  industry: 'technology',
  foundedYear: 2021,
  currency: 'MXN',
  description: 'Startup SaaS B2B de analytics para retail. Ronda Serie A levantada en 2024. 45 empleados.',

  financialYears: [
    {
      year: 2023,
      currency: 'MXN',
      exchangeRate: 17.5,
      employees: 22,
      incomeStatement: {
        revenue: 8_500_000,
        cogs: 2_125_000,
        grossProfit: 6_375_000,
        operatingExpenses: { selling: 4_250_000, admin: 2_125_000, rnd: 5_100_000, other: 425_000 },
        operatingIncome: -5_525_000,
        interestExpense: 85_000,
        interestIncome: 320_000,
        otherIncome: 0,
        ebt: -5_290_000,
        incomeTax: 0,
        netIncome: -5_290_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 18_500_000, cashEquivalents: 5_200_000, accountsReceivable: 1_275_000, inventory: 0, prepaidExpenses: 425_000, otherCurrent: 210_000 },
          nonCurrent: { 'pp&e': 1_850_000, accumulatedDepreciation: -425_000, intangibles: 3_200_000, goodwill: 0, investments: 0, otherNonCurrent: 85_000 }
        },
        liabilities: {
          current: { accountsPayable: 680_000, shortTermDebt: 425_000, accruedExpenses: 850_000, currentTaxLiability: 0, otherCurrent: 1_275_000 },
          nonCurrent: { longTermDebt: 850_000, deferredTaxLiability: 0, pensionObligations: 0, otherNonCurrent: 0 }
        },
        equity: { shareCapital: 25_000_000, retainedEarnings: -2_500_000, otherReserves: 0, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: -5_290_000, depreciation: 425_000, changesInWorkingCapital: 1_275_000, otherOperating: 850_000 },
        investing: { capex: -680_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -1_520_000 },
        financing: { debtIssued: 425_000, debtRepaid: 0, dividendsPaid: 0, sharesIssued: 0, sharesRepurchased: 0 }
      }
    },
    {
      year: 2024,
      currency: 'MXN',
      exchangeRate: 18.2,
      employees: 35,
      notes: ['Ronda Serie A de $2.5M USD levantada en Q2 2024'],
      incomeStatement: {
        revenue: 22_800_000,
        cogs: 5_472_000,
        grossProfit: 17_328_000,
        operatingExpenses: { selling: 8_520_000, admin: 4_560_000, rnd: 11_400_000, other: 912_000 },
        operatingIncome: -8_064_000,
        interestExpense: 125_000,
        interestIncome: 1_425_000,
        otherIncome: 0,
        ebt: -6_764_000,
        incomeTax: 0,
        netIncome: -6_764_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 52_800_000, cashEquivalents: 8_500_000, accountsReceivable: 3_420_000, inventory: 0, prepaidExpenses: 912_000, otherCurrent: 456_000 },
          nonCurrent: { 'pp&e': 2_736_000, accumulatedDepreciation: -855_000, intangibles: 6_840_000, goodwill: 0, investments: 0, otherNonCurrent: 228_000 }
        },
        liabilities: {
          current: { accountsPayable: 1_368_000, shortTermDebt: 684_000, accruedExpenses: 1_710_000, currentTaxLiability: 0, otherCurrent: 3_420_000 },
          nonCurrent: { longTermDebt: 1_140_000, deferredTaxLiability: 0, pensionObligations: 0, otherNonCurrent: 0 }
        },
        equity: { shareCapital: 70_000_000, retainedEarnings: -9_264_000, otherReserves: 0, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: -6_764_000, depreciation: 684_000, changesInWorkingCapital: 2_280_000, otherOperating: 1_710_000 },
        investing: { capex: -1_368_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -3_420_000 },
        financing: { debtIssued: 456_000, debtRepaid: -228_000, dividendsPaid: 0, sharesIssued: 45_000_000, sharesRepurchased: 0 }
      }
    },
    {
      year: 2025,
      currency: 'MXN',
      exchangeRate: 19.1,
      employees: 45,
      incomeStatement: {
        revenue: 48_500_000,
        cogs: 11_155_000,
        grossProfit: 37_345_000,
        operatingExpenses: { selling: 14_550_000, admin: 7_275_000, rnd: 19_400_000, other: 1_455_000 },
        operatingIncome: -5_335_000,
        interestExpense: 180_000,
        interestIncome: 2_425_000,
        otherIncome: 0,
        ebt: -3_090_000,
        incomeTax: 0,
        netIncome: -3_090_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 32_500_000, cashEquivalents: 9_500_000, accountsReceivable: 7_275_000, inventory: 0, prepaidExpenses: 1_455_000, otherCurrent: 725_000 },
          nonCurrent: { 'pp&e': 4_365_000, accumulatedDepreciation: -1_455_000, intangibles: 12_125_000, goodwill: 0, investments: 0, otherNonCurrent: 485_000 }
        },
        liabilities: {
          current: { accountsPayable: 2_425_000, shortTermDebt: 970_000, accruedExpenses: 2_910_000, currentTaxLiability: 0, otherCurrent: 7_275_000 },
          nonCurrent: { longTermDebt: 1_455_000, deferredTaxLiability: 0, pensionObligations: 0, otherNonCurrent: 0 }
        },
        equity: { shareCapital: 70_000_000, retainedEarnings: -12_354_000, otherReserves: 0, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: -3_090_000, depreciation: 1_090_000, changesInWorkingCapital: 3_855_000, otherOperating: 2_425_000 },
        investing: { capex: -2_425_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -5_285_000 },
        financing: { debtIssued: 485_000, debtRepaid: -242_500, dividendsPaid: 0, sharesIssued: 0, sharesRepurchased: 0 }
      }
    }
  ],

  expectedResults: {
    risks: [
      { id: 'risk-burn-rate', level: 'critical', description: 'Burn rate mensual de $2.8M MXN, runway de 15 meses' },
      { id: 'risk-negative-earnings', level: 'high', description: 'Pérdidas acumuladas de $12.3M MXN a pesar del crecimiento' },
      { id: 'risk-customer-acquisition-cost', level: 'high', description: 'CAC elevado: 30% de ingresos en ventas y marketing' }
    ],
    opportunities: [
      { id: 'opp-path-to-profitability', potentialValue: 15_000_000, description: 'Con 30% más de ingresos alcanza breakeven operativo' },
      { id: 'opp-series-b', potentialValue: 100_000_000, description: 'Preparar Serie B con métricas actuales de crecimiento' }
    ],
    maturityScore: 45,
    dataQualityScore: 88,
    wizardWarnings: ['Startup con pérdidas operativas - análisis estándar puede no aplicar completamente']
  },

  edgeCases: [
    'Empresa sin utilidad neta en ningún año',
    'Alta capitalización vs. pérdidas acumuladas',
    'Métricas SaaS (MRR, CAC, LTV) no capturadas en estados tradicionales',
    'Cash elevado por ronda reciente distorsiona ratios de liquidez'
  ]
}
