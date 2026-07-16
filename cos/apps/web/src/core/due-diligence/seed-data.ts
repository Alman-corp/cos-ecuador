import type { DueDiligenceCompany, FinancialYear, CompanyProfile } from "./types"

function fy(
  year: number,
  revenue: number,
  costPct: number,
  opExPct: number,
  interest: number,
  currentAssetsPct: number,
  cashPct: number,
  arPct: number,
  invPct: number,
  liabilitiesPct: number,
  currentLiabPct: number,
  ltDebtPct: number,
  ocf: number,
  icf: number,
  fcf: number,
  employees: number,
  growth?: number,
): FinancialYear {
  const cogs = revenue * costPct
  const gp = revenue - cogs
  const opEx = revenue * opExPct
  const oi = gp - opEx
  const ni = oi - interest
  const assets = revenue * (1 / (currentAssetsPct || 0.01))
  const ca = assets * currentAssetsPct
  const cash = ca * cashPct
  const ar = ca * arPct
  const inv = ca * invPct
  const tl = assets * liabilitiesPct
  const cl = tl * currentLiabPct
  const ltd = tl * ltDebtPct
  const eq = assets - tl
  return { year, revenue, costOfSales: cogs, grossProfit: gp, operatingExpenses: opEx, operatingIncome: oi, interestExpense: interest, netIncome: ni, totalAssets: Math.round(assets), currentAssets: Math.round(ca), cashAndEquivalents: Math.round(cash), accountsReceivable: Math.round(ar), inventory: Math.round(inv), totalLiabilities: Math.round(tl), currentLiabilities: Math.round(cl), longTermDebt: Math.round(ltd), equity: Math.round(eq), operatingCashflow: ocf, investingCashflow: icf, financingCashflow: fcf, employees }
}

const COMPANIES: DueDiligenceCompany[] = [
  {
    profile: { id: "corp-nac-fin", ruc: "1790012345001", name: "Corporación Nacional Financiera", industry: "Financiero", sector: "financial", description: "Institución financiera que ofrece servicios de banca corporativa, créditos comerciales y productos de inversión. Con 25 años de experiencia en el mercado ecuatoriano.", founded: 1999, status: "activa" },
    financials: [
      fy(2024, 45000000, 0.55, 0.25, 1800000, 0.75, 0.25, 0.40, 0.10, 0.72, 0.45, 0.35, 5200000, -1200000, -800000, 1200),
      fy(2023, 42000000, 0.56, 0.26, 1700000, 0.74, 0.24, 0.41, 0.09, 0.73, 0.44, 0.36, 4800000, -1100000, -700000, 1150),
      fy(2022, 38000000, 0.57, 0.27, 1600000, 0.73, 0.23, 0.42, 0.08, 0.74, 0.43, 0.37, 4400000, -1000000, -600000, 1100),
    ],
  },
  {
    profile: { id: "ind-molinera", ruc: "1790023456001", name: "Industrial Molinera SA", industry: "Manufactura", sector: "manufacturing", description: "Empresa industrial dedicada a la producción y comercialización de harinas, balanceados y derivados de cereales. Una de las procesadoras más importantes del país.", founded: 1985, status: "activa" },
    financials: [
      fy(2024, 28000000, 0.62, 0.18, 900000, 0.50, 0.10, 0.35, 0.40, 0.53, 0.40, 0.28, 3100000, -600000, -400000, 450),
      fy(2023, 26500000, 0.63, 0.19, 850000, 0.48, 0.09, 0.36, 0.38, 0.55, 0.42, 0.30, 2900000, -500000, -350000, 430),
      fy(2022, 24000000, 0.64, 0.20, 800000, 0.45, 0.08, 0.37, 0.35, 0.56, 0.43, 0.32, 2600000, -400000, -300000, 410),
    ],
  },
  {
    profile: { id: "constr-pacifico", ruc: "1790034567001", name: "Constructora del Pacífico", industry: "Construcción", sector: "construction", description: "Empresa constructora con más de 30 años de experiencia en proyectos de infraestructura vial, edificaciones comerciales y desarrollo inmobiliario en la costa ecuatoriana.", founded: 1990, status: "activa" },
    financials: [
      fy(2024, 18000000, 0.70, 0.12, 700000, 0.55, 0.12, 0.30, 0.35, 0.65, 0.50, 0.30, 1800000, -400000, -200000, 280),
      fy(2023, 20000000, 0.68, 0.13, 750000, 0.52, 0.11, 0.32, 0.33, 0.63, 0.48, 0.32, 2100000, -500000, -250000, 300),
      fy(2022, 16500000, 0.72, 0.11, 600000, 0.50, 0.10, 0.33, 0.30, 0.67, 0.52, 0.33, 1500000, -300000, -150000, 260),
    ],
  },
  {
    profile: { id: "agroexport", ruc: "1790045678001", name: "AgroExport Cía. Ltda.", industry: "Agricultura", sector: "agriculture", description: "Compañía agroexportadora especializada en banano, cacao y flores. Certificada en comercio justo y orgánico. Exporta a Europa y Estados Unidos.", founded: 2005, status: "activa" },
    financials: [
      fy(2024, 12000000, 0.58, 0.15, 350000, 0.45, 0.08, 0.30, 0.25, 0.52, 0.38, 0.25, 1500000, -300000, -200000, 190),
      fy(2023, 10800000, 0.60, 0.16, 320000, 0.42, 0.07, 0.32, 0.22, 0.54, 0.40, 0.26, 1300000, -250000, -180000, 180),
      fy(2022, 9500000, 0.62, 0.17, 280000, 0.40, 0.06, 0.33, 0.20, 0.56, 0.42, 0.27, 1100000, -200000, -150000, 170),
    ],
  },
  {
    profile: { id: "tech-solutions", ruc: "1790056789001", name: "TechSolutions Ecuador", industry: "Tecnología", sector: "technology", description: "Empresa de tecnología y desarrollo de software. Ofrece soluciones cloud, consultoría TI y desarrollo de plataformas digitales para el sector corporativo.", founded: 2015, status: "activa" },
    financials: [
      fy(2024, 8500000, 0.40, 0.30, 50000, 0.65, 0.35, 0.25, 0.05, 0.25, 0.18, 0.12, 1200000, -200000, -50000, 85),
      fy(2023, 7200000, 0.42, 0.32, 45000, 0.62, 0.33, 0.27, 0.04, 0.28, 0.20, 0.14, 1000000, -180000, -40000, 75),
      fy(2022, 5800000, 0.45, 0.33, 40000, 0.58, 0.30, 0.28, 0.03, 0.32, 0.22, 0.16, 800000, -150000, -30000, 65),
    ],
  },
]

export function getCompanies(): DueDiligenceCompany[] {
  return COMPANIES
}

export function getCompanyById(id: string): DueDiligenceCompany | undefined {
  return COMPANIES.find((c) => c.profile.id === id)
}

export function getLatestFinancials(companyId: string): DueDiligenceCompany | undefined {
  return getCompanyById(companyId)
}

export function getCompanyProfiles(): CompanyProfile[] {
  return COMPANIES.map((c) => c.profile)
}
