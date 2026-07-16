import type { VerticalPack } from "./types"

export const biOSArchitecture = {
  name: "Business Intelligence OS",
  tagline: "Centralizar, analizar, automatizar y asistir la toma de decisiones empresariales mediante inteligencia artificial.",
  kernel: {
    name: "Business Intelligence Kernel",
    description: "Núcleo compartido que todos los verticales reutilizan. Nunca se duplican funcionalidades.",
    layers: [
      {
        name: "Identity",
        description: "Empresas, multi-tenant, usuarios, roles, permisos, suscripciones.",
        status: "implemented" as const,
        components: ["Company", "User", "Role", "Permission", "Subscription"],
      },
      {
        name: "CRM Core",
        description: "Clientes, contactos, empresas, historial, timeline, relaciones.",
        status: "implemented" as const,
        components: ["Client", "Lead", "Contact", "Timeline", "AuditLog"],
      },
      {
        name: "Document Intelligence",
        description: "OCR, PDFs, Excel, Word, XML, contratos, indexación, versionado.",
        status: "implemented" as const,
        components: ["Document", "FileUpload", "Metadata", "Versioning"],
      },
      {
        name: "AI Platform",
        description: "Agentes, copilot, orquestador, tool registry, memoria, evaluación, feedback.",
        status: "implemented" as const,
        components: ["AiAgent", "AiConversation", "AiMessage", "AiTrace", "ToolRegistry", "Copilot"],
      },
      {
        name: "DNA Engine",
        description: "Reglas de evaluación, criterios de riesgo, patrones de recomendación, escalas de madurez, knowledge base.",
        status: "implemented" as const,
        components: ["EvaluationRules", "RiskThresholds", "RecommendationPatterns", "MaturityScales", "KnowledgeBase"],
      },
      {
        name: "Decision Engine",
        description: "Riesgo, priorización, reglas, recomendaciones, simulación.",
        status: "implemented" as const,
        components: ["RiskAssessment", "StrategicPlanning", "ComplianceEvaluation", "ScenarioSimulation"],
      },
      {
        name: "Workflow Engine",
        description: "BPM, automatizaciones, tareas, procesos, aprobaciones, escalamiento.",
        status: "partial" as const,
        components: ["Task", "Project", "Milestone", "WorkflowTemplate"],
      },
      {
        name: "Knowledge Graph",
        description: "Relaciones entre clientes, documentos, riesgos, objetivos, recomendaciones y resultados.",
        status: "partial" as const,
        components: ["Decision", "Recommendation", "ClientObjective", "KeyResult"],
      },
      {
        name: "Reporting Engine",
        description: "PDF, Word, PowerPoint, Excel con plantillas profesionales.",
        status: "partial" as const,
        components: ["PDFReport", "DocumentTemplate", "Export"],
      },
      {
        name: "Dashboard Engine",
        description: "KPIs, widgets, alertas, forecast, tendencias en tiempo real.",
        status: "implemented" as const,
        components: ["ExecutiveDashboard", "KPIWidgets", "AlertSystem", "Telemetry"],
      },
    ],
  },
}

export const verticalPacks: VerticalPack[] = [
  {
    id: "vip-consulting",
    name: "Consulting Intelligence OS",
    tagline: "Automatiza la consultoría estratégica y financiera.",
    audience: "Consultoras, firmas de asesoría, consultores independientes.",
    objective: "Convertir horas de análisis manual en inteligencia estratégica automatizada.",
    modules: [
      "Diagnóstico financiero automatizado",
      "Health Score y evaluación de riesgos",
      "Plan estratégico ejecutable con OKRs",
      "AI Consultant con contexto del cliente",
      "Informes profesionales PDF",
      "Benchmarking sectorial",
    ],
    dnaModules: ["Consulting DNA (reglas financieras, patrones de recomendación, escalas de madurez)"],
    status: "active",
    price: 149,
  },
  {
    id: "vip-financial",
    name: "Financial Intelligence OS",
    tagline: "El Director Financiero Inteligente.",
    audience: "CFOs, gerentes financieros, analistas, directores generales.",
    objective: "Centralizar el análisis financiero, proyecciones, simulación y reporting.",
    modules: [
      "Financial Analysis (liquidez, solvencia, rentabilidad, eficiencia, EBITDA, EVA)",
      "Forecast (ventas, caja, costos, escenarios)",
      "Cash Flow (proyección, entradas, salidas)",
      "Budget (presupuestos, variaciones, control)",
      "Valuation (DCF, CAPM, WACC, múltiplos)",
      "Simulation Engine (escenarios what-if)",
    ],
    dnaModules: ["Financial DNA (ratios, benchmarks, modelos financieros, metodologías de valoración)"],
    status: "planned",
    price: 199,
  },
  {
    id: "vip-accounting",
    name: "Accounting Intelligence OS",
    tagline: "Automatiza el despacho contable.",
    audience: "Firmas contables, contadores, departamentos de contabilidad.",
    objective: "Automatizar procesos contables, conciliaciones, declaraciones y cumplimiento.",
    modules: [
      "Libros contables automatizados",
      "Conciliaciones bancarias",
      "IVA (cálculo, declaración, reportes)",
      "Retenciones (cálculo, declaración)",
      "Declaraciones tributarias (formularios SRI)",
      "NIIF / NIIF para PYMES",
      "XML / Facturación electrónica",
      "Calendario Tributario",
    ],
    dnaModules: ["Accounting DNA (NIIF, NIC, tributación ecuatoriana, calendarios, reglas contables)"],
    status: "planned",
    price: 149,
  },
  {
    id: "vip-legal",
    name: "Legal Intelligence OS",
    tagline: "Gestiona cumplimiento y documentación legal con IA.",
    audience: "Abogados, departamentos legales, oficiales de compliance.",
    objective: "Centralizar contratos, obligaciones, compliance y riesgo legal.",
    modules: [
      "Gestión de contratos y versionado",
      "Obligaciones y deadlines",
      "Compliance y matrices legales",
      "Litigios y expedientes",
      "Firma digital",
      "Riesgo Legal",
      "IA Jurídica (análisis de documentos legales)",
    ],
    dnaModules: ["Legal DNA (leyes, jurisprudencia, contratos, compliance, matrices legales)"],
    status: "planned",
    price: 249,
  },
  {
    id: "vip-investment",
    name: "Investment Intelligence OS",
    tagline: "Analiza oportunidades de inversión con inteligencia.",
    audience: "Fondos, family offices, inversionistas ángeles, private equity.",
    objective: "Centralizar due diligence, scoring, valoración y seguimiento de portafolio.",
    modules: [
      "Due Diligence automatizado",
      "Investment Scoring",
      "Valoración (DCF, múltiplos, comparables)",
      "Portfolio Management",
      "KPIs de inversión",
      "Seguimiento de participadas",
    ],
    dnaModules: ["Investment DNA (múltiplos, venture capital, private equity, scoring, análisis sectorial)"],
    status: "planned",
    price: 299,
  },
]

export function getVerticalDnaModules(packId: string): string[] {
  const pack = verticalPacks.find((p) => p.id === packId)
  return pack?.dnaModules || []
}

export function getVerticalModules(packId: string): string[] {
  const pack = verticalPacks.find((p) => p.id === packId)
  return pack?.modules || []
}
