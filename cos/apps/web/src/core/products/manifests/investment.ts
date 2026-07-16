import type { ProductManifest } from "../manifest"

export const investmentManifest: ProductManifest = {
  id: "investment",
  name: "Investment Intelligence Suite",
  tagline: "Valoración de empresas, scoring de inversiones y due diligence automatizado",
  description: "Suite de inteligencia de inversiones con 4 métodos de valoración (DCF, Múltiplos, NAV, Costo de Reposición), scoring en 5 dimensiones, 5 métricas de portafolio y checklist completo de due diligence.",
  version: "0.1.0",
  status: "coming_soon",
  icon: "chart-bar",
  audience: "Inversionistas, fondos de inversión, banca de inversión, family offices",
  objective: "Automatizar la valoración de empresas, el scoring de oportunidades y el proceso de due diligence.",
  price: 299,

  agents: [
    { name: "ValuationAgent", description: "4 métodos de valoración y reconcilia resultados.", tools: ["dcf-valuation", "multiples-valuation", "nav-valuation", "replacement-cost", "reconcile-valuations"], memory: true, model: "rule-based + templates" },
    { name: "ScoringAgent", description: "Evalúa oportunidades en 5 dimensiones con scorecard.", tools: ["score-opportunity", "compare-opportunities", "generate-scorecard"], memory: true, model: "rule-based" },
    { name: "DDAgent", description: "Guía el due diligence con checklist completo y hallazgos.", tools: ["generate-dd-checklist", "track-dd-progress", "compile-dd-report", "flag-risks"], memory: true, model: "rule-based" },
    { name: "PortfolioAgent", description: "Monitorea rentabilidad, riesgo, diversificación, liquidez y correlación.", tools: ["calculate-portfolio-metrics", "rebalance-suggestion", "generate-portfolio-report"], memory: true, model: "rule-based" },
  ],

  rules: [
    { name: "DCF Valuation", description: "Flujo de caja descontado con proyección, WACC y valor terminal", category: "valuation", count: 5 },
    { name: "Multiples Valuation", description: "EV/EBITDA, P/E, P/B, EV/Sales con comparables", category: "valuation", count: 4 },
    { name: "NAV Valuation", description: "Activo neto ajustado con ajustes de mercado", category: "valuation", count: 3 },
    { name: "Replacement Cost", description: "Costo de reposición con depreciación y obsolescencia", category: "valuation", count: 3 },
    { name: "Scoring Criteria", description: "5 dimensiones con 24 criterios", category: "scoring", count: 24 },
    { name: "DD Checklist", description: "78 ítems en 7 áreas (financiero, legal, operativo, comercial, tech, RRHH, ambiental)", category: "dd", count: 78 },
    { name: "Portfolio Metrics", description: "Sharpe Ratio, correlación, diversificación, VaR, liquidez", category: "portfolio", count: 5 },
  ],

  dashboards: [
    { name: "Investment Dashboard", description: "Pipeline, scoring, valoraciones y portafolio", route: "/director/inversiones" },
    { name: "Valuation Center", description: "4 métodos en paralelo con reconciliación automática", route: "/director/inversiones/valoracion" },
    { name: "DD Tracker", description: "Checklist, hallazgos y progreso del due diligence", route: "/director/inversiones/dd" },
    { name: "Portfolio Dashboard", description: "5 métricas, alertas y sugerencias de rebalanceo", route: "/director/inversiones/portafolio" },
  ],

  reports: [
    { name: "Investment Memo", description: "Scoring, valoración, DD y recomendación", format: "A4 PDF" },
    { name: "Valuation Summary", description: "4 métodos con reconciliación y rango de valor", format: "A4 PDF" },
    { name: "DD Report", description: "Hallazgos, riesgos y plan de remediación", format: "A4 PDF" },
    { name: "Portfolio Report", description: "5 métricas, composición y rebalanceo", format: "A4 PDF" },
    { name: "Opportunity Scorecard", description: "5 dimensiones, puntaje y comparación", format: "A4 PDF" },
  ],

  workflows: [
    { name: "Evaluación de Inversión", description: "Oportunidad → scoring → valoración → DD → memo → decisión", steps: 6 },
    { name: "Due Diligence Completo", description: "Planificar → financiero → legal → operativo → comercial → tech → RRHH → ambiental → informe", steps: 9 },
    { name: "Rebalanceo de Portafolio", description: "Medir → comparar → sugerir → ejecutar → reportar", steps: 5 },
    { name: "Pipeline Review", description: "Pipeline → scoring → priorizar → asignar → seguimiento", steps: 5 },
  ],

  kpis: [
    { name: "IRR", description: "Tasa interna de retorno", formula: "NPV(cashflows) = 0", unit: "%" },
    { name: "MOIC", description: "Múltiplo sobre capital invertido", formula: "exitValue / investedCapital", unit: "x" },
    { name: "Investment Score", description: "Puntaje compuesto (0-100)", formula: "weightedAverage(financial, market, team, risk, strategic)", unit: "points" },
    { name: "DD Completion", description: "Avance del due diligence", formula: "completedItems / totalItems", unit: "%" },
    { name: "Pipeline Value", description: "Valor total del pipeline", formula: "sum(dealValue)", unit: "$" },
    { name: "Sharpe Ratio", description: "Retorno ajustado por riesgo", formula: "(portfolioReturn - riskFreeRate) / portfolioStd", unit: "ratio" },
    { name: "Diversification", description: "Índice de diversificación (0-1)", formula: "1 - sum(weight^2)", unit: "score" },
    { name: "VaR 95%", description: "Value at Risk al 95%", formula: "percentile(returns, 0.05)", unit: "%" },
  ],

  permissions: ["investment.read", "investment.valuate", "investment.score", "investment.dd", "investment.portfolio", "investment.manage"],
  dependencies: ["consulting", "financial", "legal"],

  configSchema: {
    defaultCurrency: { type: "select", label: "Moneda", description: "Moneda para valoraciones", default: "USD", options: [{ label: "USD", value: "USD" }, { label: "EUR", value: "EUR" }] },
    riskFreeRate: { type: "number", label: "Tasa libre de riesgo", description: "Para CAPM y DCF (%)", default: 5.5 },
    marketRiskPremium: { type: "number", label: "Prima de riesgo", description: "Prima de riesgo de mercado (%)", default: 7.2 },
    ddTemplate: { type: "select", label: "Plantilla DD", description: "Nivel de detalle del due diligence", default: "full", options: [{ label: "Completo", value: "full" }, { label: "Rápido", value: "quick" }, { label: "Express", value: "express" }] },
  },
}
