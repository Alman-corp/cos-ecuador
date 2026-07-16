import type { ProductManifest } from "../manifest"

export const accountingManifest: ProductManifest = {
  id: "accounting",
  name: "Accounting Intelligence Suite",
  tagline: "Contabilidad inteligente con NIIF, NIC, IVA y declaraciones automáticas",
  description: "Suite contable con 3 frameworks normativos (NIIF, NIIF PYMES, NIC), 5 reglas tributarias (IVA, Retenciones, ICE, ISD, Renta), calendario fiscal anual, conciliaciones y generación automática de declaraciones XML.",
  version: "0.1.0",
  status: "coming_soon",
  icon: "calculator",
  audience: "Contadores, firmas contables, departamentos financieros",
  objective: "Automatizar la contabilidad bajo NIIF con cumplimiento tributario, conciliaciones y declaraciones inteligentes.",
  price: 149,

  agents: [
    { name: "AccountingAgent", description: "Clasifica asientos, genera estados financieros bajo NIIF y detecta errores.", tools: ["classify-entry", "generate-financial-statements", "validate-entries"], memory: true, model: "rule-based" },
    { name: "TaxAgent", description: "Calcula IVA, Retenciones, ICE, ISD y Renta; genera declaraciones y XML.", tools: ["calculate-tax", "generate-declaration", "generate-xml", "validate-tax-return"], memory: true, model: "rule-based" },
    { name: "ReconciliationAgent", description: "Concilia bancos, proveedores y cuentas por cobrar vs libros.", tools: ["reconcile-bank", "reconcile-supplier", "reconcile-accounts"], memory: false, model: "rule-based" },
  ],

  rules: [
    { name: "NIIF Framework", description: "Normas Internacionales de Información Financiera completas", category: "framework", count: 30 },
    { name: "NIIF PYMES", description: "35 secciones para pequeñas y medianas empresas", category: "framework", count: 35 },
    { name: "NIC", description: "Normas Internacionales de Contabilidad vigentes", category: "framework", count: 29 },
    { name: "IVA Rules", description: "Cálculo, retenciones, declaración mensual y anexo XML", category: "tax", count: 6 },
    { name: "Withholding Rules", description: "Retenciones en la fuente: porcentajes, agentes, declaración", category: "tax", count: 5 },
    { name: "ICE Rules", description: "Impuesto a los Consumos Especiales", category: "tax", count: 4 },
    { name: "ISD Rules", description: "Impuesto a la Salida de Divisas", category: "tax", count: 3 },
    { name: "Income Tax Rules", description: "Cálculo de base imponible, tarifas, deducciones, anticipo", category: "tax", count: 8 },
  ],

  dashboards: [
    { name: "Accounting Dashboard", description: "Estados financieros, indicadores y alertas de cierre", route: "/director/contabilidad" },
    { name: "Tax Center", description: "Calendario fiscal, declaraciones pendientes y anexos XML", route: "/director/contabilidad/fiscal" },
    { name: "Reconciliation Center", description: "Conciliaciones bancarias, proveedores y cuentas por cobrar", route: "/director/contabilidad/conciliaciones" },
  ],

  reports: [
    { name: "Estados Financieros NIIF", description: "Balance, Resultados, Flujo de Efectivo, Cambios en Patrimonio", format: "A4 PDF" },
    { name: "Declaración de IVA", description: "Declaración mensual con anexo XML y retenciones", format: "XML + PDF" },
    { name: "Declaración de Renta", description: "Declaración anual con base imponible y deducciones", format: "XML + PDF" },
    { name: "Informe de Conciliación", description: "Diferencias, ajustes y saldos finales", format: "A4 PDF" },
    { name: "Reporte de Retenciones", description: "Detalle mensual con anexo REL", format: "XML + PDF" },
  ],

  workflows: [
    { name: "Cierre Contable Mensual", description: "Validar asientos → conciliar → estados financieros → declarar impuestos", steps: 6 },
    { name: "Declaración de IVA", description: "Calcular IVA → formulario → XML → presentar → archivar", steps: 5 },
    { name: "Conciliación Bancaria", description: "Importar → comparar → diferencias → ajustar → cerrar", steps: 5 },
    { name: "Cierre Fiscal Anual", description: "Consolidar → calcular renta → declaración → presentar → archivar", steps: 5 },
  ],

  kpis: [
    { name: "Días de Cierre", description: "Días hábiles para cerrar el mes", formula: "fechaCierre - fechaMes", unit: "days" },
    { name: "Tasa de IVA Efectiva", description: "IVA pagado / base imponible", formula: "ivaPagado / baseImponible", unit: "%" },
    { name: "Tasa de Retención", description: "Retenciones / base de retención", formula: "retenciones / baseRetencion", unit: "%" },
    { name: "Conciliaciones Pendientes", description: "Conciliaciones sin cerrar", formula: "count(pendientes)", unit: "count" },
    { name: "Precisión Contable", description: "Asientos sin errores", formula: "asientosCorrectos / totalAsientos", unit: "%" },
    { name: "Tiempo de Declaración", description: "Minutos para completar una declaración", formula: "horaFin - horaInicio", unit: "min" },
  ],

  permissions: ["accounting.read", "accounting.entries", "accounting.tax", "accounting.reconcile", "accounting.manage"],
  dependencies: ["consulting", "financial"],

  configSchema: {
    country: { type: "select", label: "País", description: "Jurisdicción fiscal", default: "EC", options: [{ label: "Ecuador", value: "EC" }, { label: "Colombia", value: "CO" }] },
    taxSystem: { type: "select", label: "Régimen fiscal", description: "Régimen tributario", default: "rimpe", options: [{ label: "RIMPE", value: "rimpe" }, { label: "Régimen General", value: "general" }] },
    accountingFramework: { type: "select", label: "Framework contable", description: "Normativa contable", default: "niif-pymes", options: [{ label: "NIIF Completas", value: "niif-full" }, { label: "NIIF PYMES", value: "niif-pymes" }] },
    autoGenerateDeclarations: { type: "boolean", label: "Generar declaraciones automáticas", description: "Generar XML automáticamente al cierre", default: true },
  },
}
