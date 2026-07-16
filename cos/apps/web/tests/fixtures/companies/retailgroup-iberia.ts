import type { CompanyFixture } from '../types'

export const retailgroupIberia: CompanyFixture = {
  id: 'company-retailgroup-005',
  legalName: 'RetailGroup Iberia S.L.',
  taxId: 'B87654321',
  country: 'ES',
  industry: 'retail',
  foundedYear: 2012,
  currency: 'EUR',
  description: 'Cadena de retail de moda con 45 tiendas en España y Portugal. 680 empleados. Fusión con ModaViva en Q3 2024.',

  financialYears: [
    {
      year: 2023,
      currency: 'EUR',
      exchangeRate: 1.08,
      employees: 420,
      notes: ['Solo datos de RetailGroup original (pre-fusión)'],
      incomeStatement: {
        revenue: 68_500_000,
        cogs: 41_100_000,
        grossProfit: 27_400_000,
        operatingExpenses: { selling: 10_275_000, admin: 8_562_500, rnd: 0, other: 2_055_000 },
        operatingIncome: 6_507_500,
        interestExpense: 1_370_000,
        interestIncome: 137_000,
        otherIncome: 342_500,
        ebt: 5_617_000,
        incomeTax: 1_404_250,
        netIncome: 4_212_750
      },
      balanceSheet: {
        assets: {
          current: { cash: 4_110_000, cashEquivalents: 1_370_000, accountsReceivable: 3_425_000, inventory: 10_275_000, prepaidExpenses: 685_000, otherCurrent: 1_370_000 },
          nonCurrent: { 'pp&e': 27_400_000, accumulatedDepreciation: -9_590_000, intangibles: 2_740_000, goodwill: 4_110_000, investments: 1_370_000, otherNonCurrent: 685_000 }
        },
        liabilities: {
          current: { accountsPayable: 6_850_000, shortTermDebt: 2_740_000, accruedExpenses: 2_055_000, currentTaxLiability: 548_000, otherCurrent: 1_370_000 },
          nonCurrent: { longTermDebt: 10_960_000, deferredTaxLiability: 822_000, pensionObligations: 1_370_000, otherNonCurrent: 411_000 }
        },
        equity: { shareCapital: 8_220_000, retainedEarnings: 11_645_000, otherReserves: 1_370_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: 4_212_750, depreciation: 2_055_000, changesInWorkingCapital: -685_000, otherOperating: 342_500 },
        investing: { capex: -3_425_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -685_000 },
        financing: { debtIssued: 1_370_000, debtRepaid: -2_055_000, dividendsPaid: -1_644_000, sharesIssued: 0, sharesRepurchased: 0 }
      }
    },
    {
      year: 2024,
      currency: 'EUR',
      exchangeRate: 1.09,
      employees: 650,
      notes: ['FUSIÓN: Datos combinados RetailGroup + ModaViva desde Q3 2024', 'Los números 2024 NO son comparables con 2023', 'Goodwill incluye $8.5M de la fusión'],
      incomeStatement: {
        revenue: 125_800_000,
        cogs: 78_000_000,
        grossProfit: 47_800_000,
        operatingExpenses: { selling: 18_870_000, admin: 15_725_000, rnd: 0, other: 3_774_000 },
        operatingIncome: 9_431_000,
        interestExpense: 2_516_000,
        interestIncome: 188_700,
        otherIncome: -1_258_000,
        ebt: 5_845_700,
        incomeTax: 1_461_425,
        netIncome: 4_384_275
      },
      balanceSheet: {
        assets: {
          current: { cash: 6_290_000, cashEquivalents: 2_516_000, accountsReceivable: 6_290_000, inventory: 18_870_000, prepaidExpenses: 1_258_000, otherCurrent: 2_516_000 },
          nonCurrent: { 'pp&e': 50_320_000, accumulatedDepreciation: -13_842_000, intangibles: 8_780_000, goodwill: 12_610_000, investments: 2_516_000, otherNonCurrent: 1_258_000 }
        },
        liabilities: {
          current: { accountsPayable: 12_580_000, shortTermDebt: 5_032_000, accruedExpenses: 3_774_000, currentTaxLiability: 943_500, otherCurrent: 2_516_000 },
          nonCurrent: { longTermDebt: 20_128_000, deferredTaxLiability: 1_887_000, pensionObligations: 2_516_000, otherNonCurrent: 754_800 }
        },
        equity: { shareCapital: 15_096_000, retainedEarnings: 15_645_000, otherReserves: 2_516_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: 4_384_275, depreciation: 3_145_000, changesInWorkingCapital: -2_516_000, otherOperating: 1_258_000 },
        investing: { capex: -5_032_000, acquisitions: -18_870_000, investmentsSold: 0, otherInvesting: -1_258_000 },
        financing: { debtIssued: 15_096_000, debtRepaid: -3_145_000, dividendsPaid: -2_012_800, sharesIssued: 6_876_000, sharesRepurchased: 0 }
      }
    },
    {
      year: 2025,
      currency: 'EUR',
      exchangeRate: 1.12,
      employees: 680,
      notes: ['Primer año completo post-fusión', 'Sinergias de costos empezando a materializarse'],
      incomeStatement: {
        revenue: 138_400_000,
        cogs: 84_552_000,
        grossProfit: 53_848_000,
        operatingExpenses: { selling: 19_320_000, admin: 15_584_000, rnd: 0, other: 3_460_000 },
        operatingIncome: 15_484_000,
        interestExpense: 2_768_000,
        interestIncome: 207_600,
        otherIncome: 692_000,
        ebt: 13_615_600,
        incomeTax: 3_403_900,
        netIncome: 10_211_700
      },
      balanceSheet: {
        assets: {
          current: { cash: 8_976_000, cashEquivalents: 3_452_000, accountsReceivable: 6_920_000, inventory: 19_320_000, prepaidExpenses: 1_384_000, otherCurrent: 2_768_000 },
          nonCurrent: { 'pp&e': 52_092_000, accumulatedDepreciation: -17_288_000, intangibles: 8_304_000, goodwill: 12_610_000, investments: 2_768_000, otherNonCurrent: 1_384_000 }
        },
        liabilities: {
          current: { accountsPayable: 13_148_000, shortTermDebt: 4_836_000, accruedExpenses: 3_452_000, currentTaxLiability: 1_036_000, otherCurrent: 2_768_000 },
          nonCurrent: { longTermDebt: 18_008_000, deferredTaxLiability: 1_726_000, pensionObligations: 2_768_000, otherNonCurrent: 692_000 }
        },
        equity: { shareCapital: 15_096_000, retainedEarnings: 25_130_700, otherReserves: 2_768_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: 10_211_700, depreciation: 3_444_000, changesInWorkingCapital: -1_384_000, otherOperating: 692_000 },
        investing: { capex: -5_536_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -692_000 },
        financing: { debtIssued: 1_384_000, debtRepaid: -4_152_000, dividendsPaid: -2_768_000, sharesIssued: 0, sharesRepurchased: 0 }
      }
    }
  ],

  expectedResults: {
    risks: [
      { id: 'risk-integration', level: 'high', description: 'Riesgo de integración post-fusión - sinergias aún no materializadas completamente' },
      { id: 'risk-goodwill-impairment', level: 'medium', description: 'Goodwill de €12.6M debe ser probado anualmente' }
    ],
    opportunities: [
      { id: 'opp-synergies', potentialValue: 4_500_000, description: 'Sinergias de costos adicionales por optimización de tiendas' },
      { id: 'opp-cross-selling', potentialValue: 8_000_000, description: 'Cross-selling entre bases de clientes combinadas' },
      { id: 'opp-iberia-expansion', potentialValue: 12_000_000, description: 'Expansión a más ciudades de España y Portugal' }
    ],
    maturityScore: 68,
    dataQualityScore: 75,
    wizardWarnings: [
      'FUSIÓN DETECTADA: Los datos de 2024 incluyen adquisición. El crecimiento YoY está distorsionado.',
      'El análisis debe enfocarse en 2025 vs 2024 post-fusión'
    ]
  },

  edgeCases: [
    'Datos NO comparables entre años por fusión',
    'Crecimiento YoY distorsionado artificialmente',
    'Goodwill elevado de adquisición',
    'Costos de integración one-time en 2024',
    'Ampliación de capital significativa',
    'Debe detectar automáticamente la fusión y ajustar análisis'
  ]
}
