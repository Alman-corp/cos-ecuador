export const investmentDNA = {
  version: "1.0.0",
  lastUpdated: "2026-06-28",
  name: "Investment Intelligence DNA",
  description: "Criterios de inversión, scoring, valoración y análisis de portafolio.",

  valuationMethods: [
    {
      name: "Flujo de Caja Descontado (DCF)",
      useCase: "Empresas con flujos de caja predecibles",
      inputs: ["FCF proyectado 5-10 años", "WACC", "Tasa de crecimiento terminal"],
      strengths: ["Fundamento teórico sólido", "Captura valor intrínseco"],
      weaknesses: ["Sensible a supuestos", "Complejo para empresas sin historial"],
    },
    {
      name: "Múltiplos de Mercado (Comps)",
      useCase: "Empresas comparables cotizadas",
      inputs: ["EV/EBITDA", "P/E", "P/BV", "EV/Sales"],
      strengths: ["Sencillo", "Basado en mercado real"],
      weaknesses: ["Depende de comparables adecuados", "No captura valor específico"],
    },
    {
      name: "Transacciones Comparables",
      useCase: "M&A y private equity",
      inputs: ["Múltiplos de transacciones recientes", "Prima de control"],
      strengths: ["Refleja precio real de mercado"],
      weaknesses: ["Datos limitados", "Cada transacción es única"],
    },
    {
      name: "Valor Patrimonial (NAV)",
      useCase: "Empresas con activos tangibles significativos",
      inputs: ["Activos a valor mercado", "Pasivos"],
      strengths: ["Objetivo para activos líquidos"],
      weaknesses: ["No captura valor intangible", "No considera generación de caja"],
    },
  ],

  scoringCriteria: [
    { dimension: "Equipo", weight: 0.25, factors: ["Experiencia del founder", "Trayectoria en el sector", "Complementariedad del equipo", "Capacidad de ejecución"] },
    { dimension: "Mercado", weight: 0.20, factors: ["Tamaño de mercado (TAM)", "Crecimiento del sector", "Competencia", "Barreras de entrada"] },
    { dimension: "Producto", weight: 0.20, factors: ["Diferenciación", "Traction", "Retención de clientes", "Unidad económica"] },
    { dimension: "Financiero", weight: 0.20, factors: ["Margen bruto", "Tasa de quema", "Runway", "Revenue growth"] },
    { dimension: "Riesgo", weight: 0.15, factors: ["Riesgo regulatorio", "Riesgo tecnológico", "Riesgo de ejecución", "Riesgo de mercado"] },
  ],

  portfolioMetrics: [
    { name: "TVPI", formula: "Total Value / Paid-In Capital", description: "Múltiplo total de retorno sobre capital invertido." },
    { name: "DPI", formula: "Distributions / Paid-In Capital", description: "Retorno realizado distribuido a inversores." },
    { name: "RVPI", formula: "Residual Value / Paid-In Capital", description: "Valor no realizado del portafolio." },
    { name: "IRR", formula: "Tasa que hace NPV = 0", description: "Tasa interna de retorno del portafolio." },
    { name: "MOIC", formula: "Total Value / Invested Capital", description: "Múltiplo sobre capital invertido (sin ajuste temporal)." },
  ],

  dueDiligenceChecklist: [
    { area: "Legal", items: ["Constitución y accionistas", "Contratos significativos", "Litigios", "Propiedad intelectual", "Cumplimiento normativo"] },
    { area: "Financiero", items: ["Estados financieros auditados", "Deuda y financiamiento", "Proyecciones", "Capital de trabajo", "Estructura tributaria"] },
    { area: "Comercial", items: ["Contratos con clientes", "Pipeline", "Concentración", "Retención", "Satisfacción"] },
    { area: "Operacional", items: ["Procesos clave", "Dependencias tecnológicas", "Proveedores críticos", "Equipo", "Infraestructura"] },
    { area: "Estratégico", items: ["Plan de negocio", "Ventaja competitiva", "Mercado", "Competencia", "Riesgos"] },
  ],
}
