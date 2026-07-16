import type { Vision, ProductStrategy, ICP } from "./types"

export const vision: Vision = {
  title: "Infinity Command Center — Visión 2030",
  statement: "Convertirnos en el sistema operativo de inteligencia financiera y consultoría estratégica para empresas y firmas de asesoría en Latinoamérica.",
  timeframe: "2026 — 2030",
  pillars: [
    {
      title: "Inteligencia Financiera",
      description: "Automatizar el análisis financiero, detección de riesgos y generación de recomendaciones con precisión de consultoría internacional.",
    },
    {
      title: "Plataforma Multi-Agente",
      description: "Agentes especializados (financiero, tributario, legal, estratégico) que colaboran para resolver problemas complejos de negocio.",
    },
    {
      title: "Ecosistema de Consultoría",
      description: "Marketplace de agentes, workflows y plantillas donde terceros publican y monetizan conocimiento especializado.",
    },
    {
      title: "Aprendizaje Continuo",
      description: "Cada proyecto, análisis y decisión mejora el sistema. El conocimiento de 1000 consultores en una plataforma.",
    },
  ],
}

export const strategy: ProductStrategy = {
  problem: "Las firmas de consultoría y departamentos financieros pasan el 70% de su tiempo en tareas operativas (cargar balances, calcular ratios, documentar hallazgos) y solo 30% en análisis estratégico que realmente genera valor para sus clientes.",
  solution: "Una plataforma que automatiza la operación financiera (carga, validación, ratios, riesgos, informes) y potencia el análisis estratégico con IA contextual, agentes especializados y un motor de conocimiento acumulativo.",
  valueProposition: "Automatiza el 70% del trabajo operativo de consultoría financiera y multiplica la capacidad de análisis estratégico de tu equipo.",
  buyer: "Socio/Director de consultora, CFO, Gerente Financiero, Contralor.",
  user: "Consultor financiero, analista, contador, auditor.",
  budgetApprover: "CEO, Socio fundador, Director Financiero, Comité de inversión.",
  differentiators: [
    "IA contextual con memoria empresarial (no solo chat, sino agente que conoce cada cliente, proyecto y decisión previa)",
    "Knowledge Graph que conecta problemas, normativas, ratios y resultados",
    "Consulting DNA como base de reglas propietaria (no depende de un modelo externo)",
    "Multi-tenencia real con aislamiento completo por empresa",
    "Motor de planes estratégicos ejecutables (no documentos, sino objetivos + tareas + seguimiento)",
    "Benchmarking anonimizado entre empresas del mismo sector",
  ],
  targetSegments: ["consultora", "firma_contable", "auditora", "cfo_externo", "empresa_mediana"],
}

export const icps: ICP[] = [
  {
    segment: "consultora",
    label: "Consultoras",
    description: "Firmas de consultoría estratégica, financiera y de gestión con 5-50 empleados.",
    companySize: "5-50 empleados",
    annualRevenue: "$500K - $5M",
    painPoints: [
      "Mucho tiempo manual en análisis financieros repetitivos",
      "Dificultad para estandarizar metodologías entre consultores",
      "Informes inconsistentes entre diferentes proyectos",
      "Pérdida de conocimiento cuando un consultor se va",
    ],
    useCases: [
      "Análisis financiero automatizado para clientes",
      "Generación de informes profesionales",
      "Seguimiento de planes estratégicos",
      "Benchmarking entre clientes del mismo sector",
    ],
    decisionCriteria: ["Calidad de análisis", "Ahorro de tiempo", "Profesionalismo de informes", "Precio"],
    objections: ["Ya usamos Excel", "Es muy caro para nuestra firma", "Nuestros consultores saben hacer esto"],
  },
  {
    segment: "firma_contable",
    label: "Firmas Contables",
    description: "Firmas de contabilidad que buscan escalar a servicios de consultoría de mayor valor.",
    companySize: "3-30 empleados",
    annualRevenue: "$200K - $2M",
    painPoints: [
      "Servicios de bajo valor (teneduría, declaraciones)",
      "Dificultad para vender consultoría de alto valor",
      "Poco diferenciación frente a competidores",
      "Rotación de personal y pérdida de conocimiento del cliente",
    ],
    useCases: [
      "Evolucionar de contabilidad a consultoría",
      "Análisis financiero para clientes existentes",
      "Informes de diagnóstico para captar nuevos clientes",
    ],
    decisionCriteria: ["Facilidad de uso", "Precio", "Valor agregado al cliente", "Soporte"],
    objections: ["No somos consultores", "Nuestros clientes no pagan por análisis"],
  },
  {
    segment: "auditora",
    label: "Auditoras",
    description: "Firmas de auditoría interna y externa que buscan automatizar procesos de revisión.",
    companySize: "10-100 empleados",
    annualRevenue: "$1M - $10M",
    painPoints: [
      "Procesos de auditoría manuales y lentos",
      "Dificultad para mantener consistencia entre auditores",
      "Documentación extensa y propensa a errores",
      "Presión regulatoria creciente",
    ],
    useCases: [
      "Automatización de análisis de estados financieros",
      "Detección de anomalías y riesgos",
      "Generación de papeles de trabajo",
      "Seguimiento de hallazgos y recomendaciones",
    ],
    decisionCriteria: ["Precisión", "Trazabilidad", "Cobertura normativa", "Integración con herramientas existentes"],
    objections: ["No confiamos en IA para auditoría", "Muy complejo de implementar"],
  },
  {
    segment: "cfo_externo",
    label: "CFOs Externos",
    description: "Profesionales independientes que ofrecen dirección financiera a múltiples empresas.",
    companySize: "1-5 personas",
    annualRevenue: "$100K - $500K",
    painPoints: [
      "Gestionar múltiples clientes sin estandarización",
      "Mucho tiempo en recopilar y procesar datos",
      "Dificultad para demostrar valor rápidamente",
      "No tener herramientas de análisis profundas",
    ],
    useCases: [
      "Diagnóstico financiero rápido para nuevos clientes",
      "Dashboard de KPIs para clientes",
      "Generación de informes mensuales",
      "Planificación y proyecciones financieras",
    ],
    decisionCriteria: ["Velocidad de implementación", "Multi-cliente", "Profesionalismo", "Relación costo-beneficio"],
    objections: ["Tengo mis propias plantillas", "Prefiero herramientas genéricas"],
  },
  {
    segment: "empresa_mediana",
    label: "Empresas Medianas",
    description: "Departamentos financieros de empresas con 50-500 empleados que buscan mejorar su gestión.",
    companySize: "50-500 empleados",
    annualRevenue: "$5M - $50M",
    painPoints: [
      "Datos financieros dispersos en múltiples sistemas",
      "Falta de visibilidad en tiempo real",
      "Dificultad para hacer proyecciones y escenarios",
      "Cumplimiento normativo complejo y costoso",
    ],
    useCases: [
      "Dashboard financiero corporativo",
      "Análisis de riesgos y alertas tempranas",
      "Planificación estratégica y presupuestación",
      "Cumplimiento tributario y normativo",
    ],
    decisionCriteria: ["ROI claro", "Integración con sistemas existentes", "Soporte local", "Seguridad"],
    objections: ["Ya tenemos ERP", "Muy caro para nuestra empresa"],
  },
]
