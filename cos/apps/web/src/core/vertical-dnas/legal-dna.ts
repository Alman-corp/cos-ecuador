export const legalDNA = {
  version: "1.0.0",
  lastUpdated: "2026-06-28",
  name: "Legal Intelligence DNA",
  description: "Normativa legal, compliance, contratos y gestión de riesgo legal.",

  regulatoryBodies: [
    { name: "Asamblea Nacional", role: "Legislación", jurisdiction: "Nacional" },
    { name: "Corte Nacional de Justicia", role: "Máximo tribunal ordinario", jurisdiction: "Nacional" },
    { name: "Corte Constitucional", role: "Control constitucional", jurisdiction: "Nacional" },
    { name: "Superintendencia de Compañías", role: "Control societario", jurisdiction: "Nacional" },
    { name: "Superintendencia de Bancos", role: "Control financiero", jurisdiction: "Nacional" },
    { name: "SRI", role: "Administración tributaria", jurisdiction: "Nacional" },
    { name: "Ministerio de Trabajo", role: "Regulación laboral", jurisdiction: "Nacional" },
  ],

  legalAreas: [
    {
      name: "Societario",
      laws: ["Ley de Compañías", "COPCI", "LOEPS"],
      keyAspects: ["Constitución de compañías", "Gobierno corporativo", "Juntas de accionistas", "Disolución y liquidación"],
    },
    {
      name: "Tributario",
      laws: ["LRTI", "Código Tributario", "COPCI"],
      keyAspects: ["Obligaciones tributarias", "Planificación fiscal", "Controversias", "Beneficios tributarios"],
    },
    {
      name: "Laboral",
      laws: ["Código de Trabajo", "Ley de Seguridad Social"],
      keyAspects: ["Contratos laborales", "Remuneraciones", "Terminación laboral", "Seguridad social"],
    },
    {
      name: "Compliance",
      laws: ["Ley de Prevención de Lavado", "Ley de Competencia", "LOPD"],
      keyAspects: ["Debida diligencia", "Matriz de riesgos", "Cumplimiento normativo", "Reportes regulatorios"],
    },
    {
      name: "Contratos",
      laws: ["Código Civil", "Código de Comercio"],
      keyAspects: ["Contratos comerciales", "Contratos de servicios", "Arrendamiento", "Compraventa internacional"],
    },
  ],

  contractTypes: [
    { type: "Compraventa", keyClauses: ["Precio", "Forma de pago", "Entrega", "Garantías", "Resolución"], risk: "medium" },
    { type: "Prestación de Servicios", keyClauses: ["Alcance", "Honorarios", "Plazo", "Confidencialidad", "Propiedad intelectual"], risk: "medium" },
    { type: "Arrendamiento", keyClauses: ["Canon", "Plazo", "Mantenimiento", "Subarriendo", "Renovación"], risk: "low" },
    { type: "Confidencialidad (NDA)", keyClauses: ["Definición información", "Duración", "Excepciones", "Devolución"], risk: "low" },
    { type: "Sociedad/Joint Venture", keyClauses: ["Aportes", "Gestión", "Utilidades", "Salida", "Disolución"], risk: "high" },
    { type: "Financiero", keyClauses: ["Monto", "Interés", "Plazo", "Garantías", "Vencimiento anticipado"], risk: "high" },
  ],

  complianceMatrices: [
    { area: "Tributario", checks: ["Declaraciones al día", "Pagos realizados", "Anexos presentados", "Diferencias conciliadas"], frequency: "mensual" },
    { area: "Laboral", checks: ["Contratos vigentes", "Afiliación IESS", "Décimos pagados", "Utilidades distribuidas"], frequency: "trimestral" },
    { area: "Societario", checks: ["Escrituras vigentes", "Juntas registradas", "Accionistas actualizados", "Estados financieros aprobados"], frequency: "anual" },
    { area: "Regulatorio", checks: ["Permisos vigentes", "Licencias actualizadas", "Registros sanitarios", "Patentes"], frequency: "semestral" },
  ],
}
