import type { CompanyFixture } from '../types'

export const acmeManufacturing: CompanyFixture = {
  id: 'company-acme-001',
  legalName: 'ACME Corporación Industrial S.A.',
  taxId: '1792345987001',
  country: 'EC',
  industry: 'manufacturing',
  foundedYear: 2008,
  currency: 'USD',
  description: 'Empresa manufacturera de productos metalmecánicos con 17 años en el mercado ecuatoriano. 150 empleados, exporta a 3 países de la región.',

  financialYears: [
    {
      year: 2023,
      currency: 'USD',
      exchangeRate: 1,
      employees: 138,
      incomeStatement: {
        revenue: 9_800_000,
        cogs: 6_125_000,
        grossProfit: 3_675_000,
        operatingExpenses: { selling: 880_000, admin: 1_020_000, rnd: 180_000, other: 210_000 },
        operatingIncome: 1_385_000,
        interestExpense: 195_000,
        interestIncome: 12_000,
        otherIncome: 45_000,
        ebt: 1_247_000,
        incomeTax: 275_000,
        netIncome: 972_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 680_000, cashEquivalents: 220_000, accountsReceivable: 1_450_000, inventory: 1_820_000, prepaidExpenses: 85_000, otherCurrent: 120_000 },
          nonCurrent: { 'pp&e': 8_500_000, accumulatedDepreciation: -2_850_000, intangibles: 320_000, goodwill: 0, investments: 450_000, otherNonCurrent: 180_000 }
        },
        liabilities: {
          current: { accountsPayable: 980_000, shortTermDebt: 650_000, accruedExpenses: 285_000, currentTaxLiability: 95_000, otherCurrent: 120_000 },
          nonCurrent: { longTermDebt: 3_200_000, deferredTaxLiability: 180_000, pensionObligations: 220_000, otherNonCurrent: 85_000 }
        },
        equity: { shareCapital: 2_000_000, retainedEarnings: 4_425_000, otherReserves: 150_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: 972_000, depreciation: 485_000, changesInWorkingCapital: -180_000, otherOperating: 45_000 },
        investing: { capex: -850_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -45_000 },
        financing: { debtIssued: 500_000, debtRepaid: -380_000, dividendsPaid: -250_000, sharesIssued: 0, sharesRepurchased: 0 }
      }
    },
    {
      year: 2024,
      currency: 'USD',
      exchangeRate: 1,
      employees: 144,
      incomeStatement: {
        revenue: 10_900_000,
        cogs: 6_662_500,
        grossProfit: 4_237_500,
        operatingExpenses: { selling: 945_000, admin: 1_140_000, rnd: 215_000, other: 228_000 },
        operatingIncome: 1_709_500,
        interestExpense: 175_000,
        interestIncome: 18_500,
        otherIncome: 52_000,
        ebt: 1_605_000,
        incomeTax: 353_000,
        netIncome: 1_252_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 785_000, cashEquivalents: 245_000, accountsReceivable: 1_625_000, inventory: 1_945_000, prepaidExpenses: 92_000, otherCurrent: 135_000 },
          nonCurrent: { 'pp&e': 9_200_000, accumulatedDepreciation: -3_285_000, intangibles: 385_000, goodwill: 0, investments: 520_000, otherNonCurrent: 195_000 }
        },
        liabilities: {
          current: { accountsPayable: 1_045_000, shortTermDebt: 580_000, accruedExpenses: 310_000, currentTaxLiability: 108_000, otherCurrent: 135_000 },
          nonCurrent: { longTermDebt: 2_980_000, deferredTaxLiability: 195_000, pensionObligations: 235_000, otherNonCurrent: 92_000 }
        },
        equity: { shareCapital: 2_000_000, retainedEarnings: 5_527_000, otherReserves: 168_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: 1_252_000, depreciation: 520_000, changesInWorkingCapital: -215_000, otherOperating: 52_000 },
        investing: { capex: -920_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -68_000 },
        financing: { debtIssued: 300_000, debtRepaid: -520_000, dividendsPaid: -285_000, sharesIssued: 0, sharesRepurchased: 0 }
      }
    },
    {
      year: 2025,
      currency: 'USD',
      exchangeRate: 1,
      employees: 150,
      notes: ['Se firmó contrato de exportación con Colombia en Q2 2025', 'Ampliación de planta completada en Q3 2025'],
      incomeStatement: {
        revenue: 12_450_000,
        cogs: 7_470_000,
        grossProfit: 4_980_000,
        operatingExpenses: { selling: 1_085_000, admin: 1_285_000, rnd: 265_000, other: 245_000 },
        operatingIncome: 2_100_000,
        interestExpense: 158_000,
        interestIncome: 24_000,
        otherIncome: 58_000,
        ebt: 2_024_000,
        incomeTax: 445_000,
        netIncome: 1_579_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 895_000, cashEquivalents: 285_000, accountsReceivable: 1_890_000, inventory: 2_125_000, prepaidExpenses: 108_000, otherCurrent: 152_000 },
          nonCurrent: { 'pp&e': 11_500_000, accumulatedDepreciation: -3_840_000, intangibles: 445_000, goodwill: 0, investments: 595_000, otherNonCurrent: 215_000 }
        },
        liabilities: {
          current: { accountsPayable: 1_185_000, shortTermDebt: 520_000, accruedExpenses: 345_000, currentTaxLiability: 125_000, otherCurrent: 152_000 },
          nonCurrent: { longTermDebt: 2_650_000, deferredTaxLiability: 215_000, pensionObligations: 252_000, otherNonCurrent: 98_000 }
        },
        equity: { shareCapital: 2_000_000, retainedEarnings: 6_723_000, otherReserves: 185_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: 1_579_000, depreciation: 585_000, changesInWorkingCapital: -248_000, otherOperating: 62_000 },
        investing: { capex: -1_850_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -72_000 },
        financing: { debtIssued: 800_000, debtRepaid: -940_000, dividendsPaid: -325_000, sharesIssued: 0, sharesRepurchased: 0 }
      }
    }
  ],

  expectedResults: {
    risks: [
      { id: 'risk-client-concentration', level: 'high', description: 'Concentración de clientes: top 2 = 65% de ingresos' },
      { id: 'risk-cash-runway', level: 'medium', description: 'Runway de caja: 4.2 meses vs 8 recomendados' },
      { id: 'risk-dso-increasing', level: 'medium', description: 'DSO creciente: 53 → 68 días en 3 años' }
    ],
    opportunities: [
      { id: 'opp-supplier-negotiation', potentialValue: 380_000, description: 'Renegociación con proveedores (COGS 8% sobre benchmark)' },
      { id: 'opp-colombia-expansion', potentialValue: 2_500_000, description: 'Expansión a mercado colombiano (contrato firmado)' }
    ],
    maturityScore: 72,
    dataQualityScore: 92,
    wizardWarnings: []
  },

  edgeCases: [
    'Empresa saludable - caso de control para verificar que no hay falsos positivos',
    'Crecimiento sostenido con márgenes mejorando'
  ]
}
