import type { ProductManifest } from "../manifest"

export const consultingManifest: ProductManifest = {
  id: "consulting",
  name: "Consulting Intelligence Suite",
  tagline: "Diagnóstico estratégico, financiero y operativo para PYMEs",
  description:
    "Suite de consultoría empresarial que convierte datos financieros en diagnósticos, riesgos, planes estratégicos ejecutables y reportes profesionales. Incluye 12 reglas de evaluación, 14 umbrales de riesgo, 15 patrones de recomendación, 5 escalas de madurez y 14 entradas de base de conocimiento con normativa ecuatoriana.",
  version: "1.0.0",
  status: "active",
  icon: "briefcase",
  audience: "Consultores, firmas de consultoría, PYMEs",
  objective:
    "Digitalizar y escalar la consultoría empresarial con inteligencia de dominio, análisis automatizado y planes estratégicos ejecutables.",
  price: 149,

  agents: [
    {
      name: "CopilotPrincipal",
      description: "Agente principal de IA con 7 herramientas: evaluar empresa, diagnosticar riesgo, recomendar estrategia, analizar KPI, generar compliance, analizar gap estratégico y buscar en knowledge base.",
      tools: ["evaluate", "diagnose", "recommend", "analyze", "compliance", "gap", "knowledge"],
      memory: true,
      model: "rule-based + LLM (future)",
    },
    {
      name: "StrategicPlanner",
      description: "Convierte objetivos estratégicos en planes ejecutables con OKRs, proyectos y tareas asignadas.",
      tools: ["create-objective", "generate-keyresults", "assign-tasks"],
      memory: true,
      model: "rule-based",
    },
    {
      name: "ReportGenerator",
      description: "Genera reportes PDF profesionales de 5 páginas con cover, resumen ejecutivo, KPIs, riesgos, plan estratégico y documentos adjuntos.",
      tools: ["generate-pdf", "compile-data", "format-report"],
      memory: false,
      model: "template-based",
    },
  ],

  rules: [
    { name: "Evaluación Financiera", description: "12 razones financieras con umbrales sectoriales", category: "financial", count: 12 },
    { name: "Evaluación de Riesgos", description: "14 umbrales de riesgo en 7 categorías", category: "risk", count: 14 },
    { name: "Recomendaciones Estratégicas", description: "15 patrones de recomendación en 6 áreas", category: "strategy", count: 15 },
    { name: "Escalas de Madurez", description: "5 escalas con 5 niveles cada una", category: "maturity", count: 5 },
    { name: "Cumplimiento Normativo", description: "14 entradas de knowledge base con normativa ecuatoriana", category: "compliance", count: 14 },
    { name: "Análisis de Gap Estratégico", description: "Evaluación de brecha en 6 dimensiones", category: "strategy", count: 1 },
  ],

  dashboards: [
    { name: "Executive Dashboard", description: "Health score, KPI grid, riesgos activos, últimas evaluaciones", route: "/director" },
    { name: "Client Detail", description: "Health score gauge, documentos, análisis, plan estratégico, PDF", route: "/director/clientes/[id]" },
    { name: "Consulting DNA Browser", description: "Explorador interactivo del DNA: reglas, riesgos, patrones, escalas, knowledge", route: "/director/adn" },
  ],

  reports: [
    { name: "Informe Ejecutivo de Consultoría", description: "5 páginas: cover, resumen ejecutivo, KPIs, riesgos, plan estratégico, documentos", format: "A4 PDF" },
    { name: "Diagnóstico Financiero", description: "12 razones financieras con interpretación y recomendaciones", format: "A4 PDF" },
    { name: "Matriz de Riesgos", description: "14 umbrales evaluados con severity, probabilidad, impacto y mitigación", format: "A4 PDF" },
  ],

  workflows: [
    { name: "Onboarding de Cliente", description: "Registro → documentos → análisis → diagnóstico → plan estratégico → PDF", steps: 6 },
    { name: "Plan Estratégico Ejecutable", description: "Objetivos → OKRs → proyectos → tareas con seguimiento", steps: 4 },
    { name: "Revisión Periódica", description: "Evaluación recurrente de salud con generación automática de reportes", steps: 5 },
  ],

  kpis: [
    { name: "Health Score", description: "Puntaje compuesto de salud empresarial (0-100)", formula: "weightedAverage(liquidity, solvency, profitability, efficiency, leverage)", unit: "points" },
    { name: "Liquidity Ratio", description: "Capacidad de pago a corto plazo", formula: "currentAssets / currentLiabilities", unit: "ratio" },
    { name: "Solvency Ratio", description: "Capacidad de pago a largo plazo", formula: "totalAssets / totalLiabilities", unit: "ratio" },
    { name: "ROE", description: "Return on Equity", formula: "netIncome / equity", unit: "%" },
    { name: "ROA", description: "Return on Assets", formula: "netIncome / totalAssets", unit: "%" },
    { name: "EBITDA Margin", description: "Margen operativo", formula: "ebitda / totalRevenue", unit: "%" },
    { name: "Debt-to-Equity", description: "Nivel de endeudamiento", formula: "totalLiabilities / equity", unit: "ratio" },
  ],

  permissions: ["consulting.read", "consulting.analyze", "consulting.manage", "consulting.reports", "consulting.plans"],
  dependencies: [],

  configSchema: {
    defaultCurrency: { type: "select", label: "Moneda por defecto", description: "Moneda para todos los reportes financieros", default: "USD", options: [{ label: "USD Dólar", value: "USD" }, { label: "EUR Euro", value: "EUR" }] },
    country: { type: "select", label: "País", description: "Jurisdicción para reglas de compliance", default: "EC", options: [{ label: "Ecuador", value: "EC" }, { label: "Colombia", value: "CO" }, { label: "Perú", value: "PE" }, { label: "México", value: "MX" }] },
    autoGenerateReports: { type: "boolean", label: "Generar reportes automáticos", description: "Generar PDF automáticamente al completar un análisis", default: true },
    maxClientsPerAnalysis: { type: "number", label: "Máximo de clientes por análisis", description: "Límite de clientes en análisis batch", default: 50 },
  },
}
