import type { ProductManifest } from "../manifest"

export const financialManifest: ProductManifest = {
  id: "financial",
  name: "Financial Intelligence Suite",
  tagline: "Modelamiento financiero, proyecciones y valoración de empresas",
  description: "Suite de inteligencia financiera con 6 modelos de valoración (DuPont, DCF, CAPM, WACC, EVA, Altman Z-Score), 13 indicadores, 6 benchmarks sectoriales y 5 escenarios de proyección.",
  version: "0.1.0",
  status: "coming_soon",
  icon: "chart-line",
  audience: "CFOs, analistas financieros, banca de inversión, corporate finance",
  objective: "Automatizar el modelamiento financiero, la valoración de empresas y la simulación de escenarios.",
  price: 199,

  agents: [
    { name: "FinancialAnalyst", description: "Calcula 13 indicadores financieros y genera reportes de liquidez, solvencia, rentabilidad y eficiencia.", tools: ["calculate-ratios", "generate-financial-report", "analyze-trends"], memory: true, model: "rule-based" },
    { name: "ValuationAgent", description: "Ejecuta modelos DCF, CAPM, WACC, EVA y Altman Z-Score con datos financieros reales.", tools: ["dcf-valuation", "capm-calculate", "wacc-calculate", "eva-calculate", "zscore-calculate"], memory: true, model: "rule-based + templates" },
    { name: "ScenarioSimulator", description: "Genera 5 escenarios (optimista, base, pesimista, estrés, recuperación) con impacto en KPIs.", tools: ["run-scenario", "compare-scenarios", "generate-scenario-report"], memory: true, model: "rule-based" },
  ],

  rules: [
    { name: "DuPont Analysis", description: "Descomposición del ROE en margen neto, rotación de activos y apalancamiento", category: "valuation", count: 3 },
    { name: "DCF Valuation", description: "Flujo de caja descontado con proyección a 5 años y WACC", category: "valuation", count: 5 },
    { name: "CAPM", description: "Costo de capital con beta, prima de riesgo y tasa libre de riesgo", category: "valuation", count: 4 },
    { name: "WACC", description: "Costo promedio ponderado de capital", category: "valuation", count: 3 },
    { name: "EVA", description: "Valor económico agregado con NOPAT y capital invertido", category: "valuation", count: 3 },
    { name: "Altman Z-Score", description: "Predicción de quiebra con 5 variables financieras", category: "risk", count: 5 },
    { name: "Benchmarks Sectoriales", description: "6 benchmarks por sector industrial", category: "benchmark", count: 6 },
  ],

  dashboards: [
    { name: "CFO Dashboard", description: "Indicadores financieros en tiempo real, alertas y proyecciones", route: "/director/financiero" },
    { name: "Valuation Center", description: "Modelos DCF, CAPM, WACC, EVA y Z-Score en vivo", route: "/director/financiero/valoracion" },
    { name: "Scenario Lab", description: "5 escenarios con comparación de impacto en KPIs", route: "/director/financiero/escenarios" },
  ],

  reports: [
    { name: "Executive Financial Report", description: "13 indicadores, tendencias, benchmarks y alertas", format: "A4 PDF" },
    { name: "Valuation Report", description: "DCF, CAPM, WACC, EVA y Z-Score completos", format: "A4 PDF" },
    { name: "Scenario Comparison", description: "5 escenarios con impacto en EBITDA, ROE, liquidez y solvencia", format: "A4 PDF" },
    { name: "DuPont Analysis", description: "Descomposición del ROE con interpretación", format: "A4 PDF" },
  ],

  workflows: [
    { name: "Monthly Financial Review", description: "Cargar datos → calcular indicadores → comparar benchmarks → generar reporte", steps: 5 },
    { name: "Company Valuation", description: "Inputs → DCF → CAPM → WACC → EVA → Z-Score → informe final", steps: 7 },
    { name: "Scenario Planning", description: "Supuestos → 5 escenarios → comparar → recomendar", steps: 4 },
    { name: "Quarterly Benchmarking", description: "Benchmarking trimestral contra sector con alertas", steps: 4 },
  ],

  kpis: [
    { name: "Current Ratio", description: "Liquidez corriente", formula: "currentAssets / currentLiabilities", unit: "ratio" },
    { name: "Quick Ratio", description: "Prueba ácida", formula: "(currentAssets - inventory) / currentLiabilities", unit: "ratio" },
    { name: "Debt-to-Equity", description: "Apalancamiento", formula: "totalLiabilities / equity", unit: "ratio" },
    { name: "Interest Coverage", description: "Cobertura de intereses", formula: "ebit / interestExpense", unit: "ratio" },
    { name: "Net Profit Margin", description: "Margen neto", formula: "netIncome / revenue", unit: "%" },
    { name: "Asset Turnover", description: "Rotación de activos", formula: "revenue / totalAssets", unit: "ratio" },
    { name: "WACC", description: "Costo promedio ponderado de capital", formula: "E/V * Re + D/V * Rd * (1 - Tc)", unit: "%" },
    { name: "EVA", description: "Valor económico agregado", formula: "NOPAT - (capital * WACC)", unit: "$" },
    { name: "Altman Z-Score", description: "Predicción de quiebra", formula: "1.2A + 1.4B + 3.3C + 0.6D + 1.0E", unit: "score" },
    { name: "DCF Value", description: "Valor intrínseco por DCF", formula: "sum(FCF / (1+WACC)^n) + terminalValue", unit: "$" },
    { name: "CAPM Return", description: "Retorno esperado", formula: "Rf + beta * (Rm - Rf)", unit: "%" },
    { name: "Free Cash Flow", description: "Flujo de caja libre", formula: "operatingCF - capex", unit: "$" },
    { name: "Working Capital", description: "Capital de trabajo", formula: "currentAssets - currentLiabilities", unit: "$" },
  ],

  permissions: ["financial.read", "financial.analyze", "financial.valuate", "financial.simulate", "financial.manage"],
  dependencies: ["consulting"],

  configSchema: {
    defaultCurrency: { type: "select", label: "Moneda", description: "Moneda para valoraciones", default: "USD", options: [{ label: "USD", value: "USD" }, { label: "EUR", value: "EUR" }] },
    riskFreeRate: { type: "number", label: "Tasa libre de riesgo", description: "Tasa libre de riesgo para CAPM (%)", default: 5.5 },
    marketRiskPremium: { type: "number", label: "Prima de riesgo de mercado", description: "Prima de riesgo de mercado (%)", default: 7.2 },
    projectionYears: { type: "number", label: "Años de proyección", description: "Años para proyección DCF", default: 5 },
    terminalGrowthRate: { type: "number", label: "Tasa de crecimiento perpetuo", description: "Tasa de crecimiento para valor terminal (%)", default: 3.0 },
  },
}
