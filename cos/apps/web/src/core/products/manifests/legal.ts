import type { ProductManifest } from "../manifest"

export const legalManifest: ProductManifest = {
  id: "legal",
  name: "Legal Intelligence Suite",
  tagline: "Gestión legal inteligente con compliance, contratos y procesos judiciales",
  description: "Suite legal con 7 entes regulatorios, 5 áreas legales, 6 tipos de contratos con cláusulas inteligentes, 4 matrices de compliance y seguimiento de expedientes judiciales.",
  version: "0.1.0",
  status: "coming_soon",
  icon: "gavel",
  audience: "Abogados, firmas legales, departamentos jurídicos corporativos",
  objective: "Digitalizar la práctica legal con inteligencia de dominio, automatización de contratos y compliance predictivo.",
  price: 249,

  agents: [
    { name: "ContractAgent", description: "Genera, revisa y sugiere cláusulas para 6 tipos contractuales.", tools: ["generate-contract", "review-clause", "suggest-amendment", "compare-versions"], memory: true, model: "rule-based + templates" },
    { name: "ComplianceAgent", description: "Evalúa cumplimiento normativo en 4 matrices y genera planes de remediación.", tools: ["evaluate-compliance", "generate-remediation", "track-obligations"], memory: true, model: "rule-based" },
    { name: "LitigationAgent", description: "Gestiona expedientes, plazos procesales, notificaciones y estrategia legal.", tools: ["track-case", "calculate-deadlines", "generate-pleading", "notify-parties"], memory: true, model: "rule-based" },
  ],

  rules: [
    { name: "Regulatory Bodies", description: "7 entes regulatorios ecuatorianos", category: "regulatory", count: 7 },
    { name: "Corporate Law", description: "Derecho societario: constitución, tipos, juntas, reformas, disolución", category: "legal_area", count: 10 },
    { name: "Labor Law", description: "Contratos, remuneraciones, beneficios, terminación, indemnizaciones", category: "legal_area", count: 12 },
    { name: "Tax Law", description: "Obligaciones, plazos, sanciones, procedimientos, exenciones", category: "legal_area", count: 8 },
    { name: "Contract Types", description: "6 tipos: servicios, compraventa, arriendo, confidencialidad, sociedad, distribución", category: "contract", count: 6 },
    { name: "Compliance Matrix", description: "4 matrices: laboral, tributario, societario, datos personales", category: "compliance", count: 4 },
    { name: "IP Law", description: "Marcas, patentes, derechos de autor, secretos empresariales", category: "legal_area", count: 6 },
  ],

  dashboards: [
    { name: "Legal Dashboard", description: "Expedientes activos, contratos vigentes, alertas de compliance", route: "/director/legal" },
    { name: "Contract Center", description: "Generación, revisión, comparación y almacenamiento de contratos", route: "/director/legal/contratos" },
    { name: "Compliance Center", description: "Matrices, evaluaciones y planes de remediación", route: "/director/legal/compliance" },
    { name: "Litigation Tracker", description: "Expedientes judiciales con plazos, alertas y notificaciones", route: "/director/legal/litigios" },
  ],

  reports: [
    { name: "Informe de Compliance", description: "Evaluación en 4 matrices con hallazgos y recomendaciones", format: "A4 PDF" },
    { name: "Contrato Inteligente", description: "Cláusulas inteligentes, anexos y resumen ejecutivo", format: "A4 PDF + DOCX" },
    { name: "Estado de Expediente", description: "Actuaciones, plazos y próximos pasos", format: "A4 PDF" },
    { name: "Due Diligence Legal", description: "Hallazgos, riesgos y recomendaciones", format: "A4 PDF" },
    { name: "Matriz de Riesgos Legales", description: "Probabilidad, impacto, severidad y mitigación", format: "A4 PDF" },
  ],

  workflows: [
    { name: "Due Diligence Legal", description: "Solicitar docs → societario → laboral → tributario → contractual → informe", steps: 6 },
    { name: "Contratación Inteligente", description: "Seleccionar tipo → borrador → revisar → aprobar → firmar → archivar", steps: 6 },
    { name: "Gestión de Expediente", description: "Apertura → asignar → seguimiento → notificaciones → cierre", steps: 5 },
    { name: "Evaluación de Compliance", description: "Seleccionar matriz → evidencia → evaluar → plan → seguimiento", steps: 5 },
  ],

  kpis: [
    { name: "Expedientes Activos", description: "Expedientes judiciales en curso", formula: "count(activos)", unit: "count" },
    { name: "Tasa de Cumplimiento", description: "Cumplimiento en matrices de compliance", formula: "cumplimientos / totalEvaluaciones", unit: "%" },
    { name: "Contratos Vigentes", description: "Contratos activos sin vencimiento", formula: "count(vigentes)", unit: "count" },
    { name: "Tiempo de Revisión", description: "Horas promedio para revisar un contrato", formula: "sum(tiempoRevision) / count(contratos)", unit: "hours" },
    { name: "Alertas de Vencimiento", description: "Contratos por vencer en 30 días", formula: "count(proximoVencimiento)", unit: "count" },
    { name: "Casos Ganados", description: "Porcentaje de casos favorables", formula: "casosFavorables / totalCasos", unit: "%" },
  ],

  permissions: ["legal.read", "legal.contracts", "legal.compliance", "legal.litigation", "legal.manage"],
  dependencies: ["consulting"],

  configSchema: {
    jurisdiction: { type: "select", label: "Jurisdicción", description: "País para reglas legales", default: "EC", options: [{ label: "Ecuador", value: "EC" }, { label: "Colombia", value: "CO" }] },
    defaultLanguage: { type: "select", label: "Idioma de contratos", description: "Idioma por defecto para generación de contratos", default: "es", options: [{ label: "Español", value: "es" }, { label: "Inglés", value: "en" }] },
    autoComplianceAlerts: { type: "boolean", label: "Alertas automáticas de compliance", description: "Notificar automáticamente cuando se acerquen vencimientos", default: true },
  },
}
