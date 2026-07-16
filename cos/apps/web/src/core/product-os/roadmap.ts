import type { RoadmapItem, Risk, CompetitiveEntry, Investment, AiStrategy } from "./types"

export const roadmap: RoadmapItem[] = [
  {
    id: "r-001", title: "Beta Privada (5-10 empresas)", description: "Lanzar beta cerrada con empresas reales para validar flujo completo, medir adopción y recoger feedback estructurado.",
    quarter: "Q3 2026", priority: "p0", status: "planned", category: "platform",
    impact: "high", effort: "medium", dependencies: [],
  },
  {
    id: "r-002", title: "AI Copilot con contexto completo", description: "Copilot con conocimiento del cliente, memoria de conversaciones, herramientas ejecutables y feedback loop.",
    quarter: "Q3 2026", priority: "p0", status: "completed", category: "ia",
    impact: "high", effort: "medium", dependencies: [],
  },
  {
    id: "r-003", title: "Product OS Dashboard", description: "Dashboard de métricas de producto: adopción, activación, retención, uso de IA, time-to-value.",
    quarter: "Q3 2026", priority: "p0", status: "in_progress", category: "platform",
    impact: "high", effort: "small", dependencies: [],
  },
  {
    id: "r-004", title: "Plan Estratégico Ejecutable", description: "Convertir análisis en objetivos, key results y tareas asignables con responsable y fecha.",
    quarter: "Q3 2026", priority: "p1", status: "completed", category: "analisis",
    impact: "high", effort: "medium", dependencies: [],
  },
  {
    id: "r-005", title: "Informe PDF Profesional", description: "Generación de informe PDF tipo consultora internacional con portada, ratios, riesgos, recomendaciones y plan estratégico.",
    quarter: "Q3 2026", priority: "p1", status: "completed", category: "analisis",
    impact: "high", effort: "medium", dependencies: [],
  },
  {
    id: "r-006", title: "Consulting DNA", description: "Base de reglas de evaluación, criterios de riesgo, patrones de recomendación, escalas de madurez y knowledge base.",
    quarter: "Q3 2026", priority: "p1", status: "completed", category: "ia",
    impact: "high", effort: "medium", dependencies: [],
  },
  {
    id: "r-007", title: "Multi-Agent Orchestrator", description: "Sistema de agentes especializados (financiero, tributario, legal, riesgo, estrategia) con router de intenciones.",
    quarter: "Q4 2026", priority: "p1", status: "planned", category: "ia",
    impact: "high", effort: "large", dependencies: ["r-002", "r-006"],
  },
  {
    id: "r-008", title: "Simulation Engine", description: "Motor de simulación de escenarios: ¿qué pasa si suben ventas 15%, baja IVA, nuevo préstamo? Recalcular ratios y health score.",
    quarter: "Q4 2026", priority: "p2", status: "planned", category: "analisis",
    impact: "high", effort: "large", dependencies: ["r-004"],
  },
  {
    id: "r-009", title: "Benchmarking Sectorial", description: "Comparar KPIs de la empresa contra anónimos del mismo sector, provincia y tamaño.",
    quarter: "Q1 2027", priority: "p2", status: "planned", category: "analisis",
    impact: "medium", effort: "large", dependencies: [],
  },
  {
    id: "r-010", title: "Knowledge Graph", description: "Grafo de conocimiento empresarial conectando clientes, problemas, normas, ratios, riesgos y resultados.",
    quarter: "Q1 2027", priority: "p2", status: "planned", category: "ia",
    impact: "high", effort: "large", dependencies: ["r-006", "r-007"],
  },
  {
    id: "r-011", title: "Workflow Studio", description: "Editor de workflows para automatizar procesos de consultoría: diseño, simulación, publicación, versionado.",
    quarter: "Q2 2027", priority: "p3", status: "planned", category: "workflow",
    impact: "high", effort: "large", dependencies: ["r-007"],
  },
  {
    id: "r-012", title: "AI Agent Platform", description: "Plataforma para gestionar agentes: prompts, modelos, herramientas, versiones, costos, evaluaciones, A/B testing.",
    quarter: "Q2 2027", priority: "p3", status: "planned", category: "ia",
    impact: "high", effort: "large", dependencies: ["r-007"],
  },
  {
    id: "r-013", title: "Marketplace de Agentes", description: "Marketplace donde terceros publican agentes, workflows y plantillas de informes.",
    quarter: "Q3 2027", priority: "p3", status: "planned", category: "monetizacion",
    impact: "medium", effort: "large", dependencies: ["r-011", "r-012"],
  },
  {
    id: "r-014", title: "Stripe Checkout + Webhooks", description: "Sistema de suscripciones real con Stripe: checkout, webhook, portal, facturación, dunning.",
    quarter: "Q3 2026", priority: "p1", status: "planned", category: "monetizacion",
    impact: "high", effort: "medium", dependencies: [],
  },
  {
    id: "r-015", title: "Enforcement de Límites por Plan", description: "Sistema que mide uso contra límites del plan y bloquea/notifica cuando se exceden.",
    quarter: "Q3 2026", priority: "p1", status: "planned", category: "monetizacion",
    impact: "high", effort: "medium", dependencies: ["r-014"],
  },
]

export const risks: Risk[] = [
  {
    id: "risk-001", title: "Baja adopción en beta", description: "Las empresas invitadas no usan la plataforma de forma consistente durante la beta.",
    category: "comercial", probability: 3, impact: 4,
    mitigation: "Seleccionar empresas con perfil adecuado, reuniones semanales, incentivos claros, y medir uso desde el día 1.",
    owner: "Product", status: "identified",
  },
  {
    id: "risk-002", title: "Calidad insuficiente del análisis", description: "Los análisis generados no alcanzan la profundidad que espera un consultor profesional.",
    category: "tecnico", probability: 2, impact: 5,
    mitigation: "Feedback loop con el Consulting DNA. Cada corrección del consultor mejora el sistema. Evaluación continua de precisión.",
    owner: "AI/ML", status: "mitigated",
  },
  {
    id: "risk-003", title: "Dependencia de APIs externas", description: "El sistema depende de APIs de IA (GPT, Claude, Gemini) que pueden cambiar precios, términos o disponibilidad.",
    category: "operacional", probability: 3, impact: 3,
    mitigation: "Arquitectura agnóstica al proveedor. Soporte para modelos open source locales. Estrategia multi-provider.",
    owner: "Engineering", status: "mitigated",
  },
  {
    id: "risk-004", title: "Cumplimiento de datos", description: "Manejo de datos financieros sensibles de múltiples empresas. Riesgo regulatorio y de privacidad.",
    category: "legal", probability: 2, impact: 5,
    mitigation: "Cifrado en reposo y tránsito. Aislamiento multi-tenant por companyId. Política de retención de datos. Cumplimiento LOPD.",
    owner: "Legal", status: "identified",
  },
  {
    id: "risk-005", title: "Precio no validado", description: "Los planes de pricing pueden no reflejar lo que el mercado está dispuesto a pagar.",
    category: "comercial", probability: 4, impact: 3,
    mitigation: "Validar pricing en beta con preguntas directas. Probar 3 escenarios de precio. Ofrecer descuento early adopter.",
    owner: "Product", status: "identified",
  },
  {
    id: "risk-006", title: "Rotación de usuarios clave", description: "El consultor que usa la plataforma se va de la firma y el nuevo no la adopta.",
    category: "comercial", probability: 3, impact: 3,
    mitigation: "Hacer que la plataforma sea indispensable para la firma, no solo para el individuo. Onboarding para nuevos usuarios.",
    owner: "Product", status: "identified",
  },
  {
    id: "risk-007", title: "Costos de IA escalando", description: "A medida que crece el uso, los costos de APIs de IA pueden superar el margen del plan.",
    category: "financiero", probability: 3, impact: 4,
    mitigation: "Monitoreo de costo por análisis. Modelos más eficientes para tareas repetitivas. Caché de respuestas comunes. Límites por plan.",
    owner: "Engineering", status: "identified",
  },
]

export const competitiveMatrix: CompetitiveEntry[] = [
  { competitor: "Excel + Plantillas", category: "análisis financiero", ourStrength: 9, theirStrength: 4, notes: "Excel es ubicuo pero no escala. No tiene IA, memoria ni colaboración." },
  { competitor: "Power BI / Tableau", category: "business intelligence", ourStrength: 7, theirStrength: 7, notes: "Buenos en visualización pero no hacen análisis financiero profundo ni dan recomendaciones." },
  { competitor: "QuickBooks / Xero", category: "contabilidad", ourStrength: 8, theirStrength: 5, notes: "Herramientas contables, no de consultoría. No hacen análisis estratégico." },
  { competitor: "ChatGPT / Claude", category: "IA general", ourStrength: 8, theirStrength: 6, notes: "IA potente pero sin contexto empresarial, memoria multi-cliente ni herramientas especializadas." },
  { competitor: "SAP Analytics Cloud", category: "analítica corporativa", ourStrength: 6, theirStrength: 8, notes: "Muy completo pero caro, complejo y orientado a grandes corporaciones." },
  { competitor: "Firmitas / Auditool", category: "auditoría", ourStrength: 7, theirStrength: 5, notes: "Orientados a papeles de trabajo, no a inteligencia financiera ni estrategia." },
  { competitor: "Consultoría tradicional", category: "servicios", ourStrength: 8, theirStrength: 3, notes: "Alta calidad pero lenta, cara y no escala. Nosotros automatizamos el 70% operativo." },
]

export const investment: Investment = {
  estimatedMonthlyRunway: 5000,
  currentMRR: 0,
  breakEvenMRR: 15000,
  projectedBreakEven: "Q2 2027",
  costBreakdown: [
    { category: "Infraestructura (cloud + APIs)", amount: 1500, percentage: 30 },
    { category: "Herramientas y servicios", amount: 500, percentage: 10 },
    { category: "Dominios y licencias", amount: 200, percentage: 4 },
    { category: "Marketing y adquisición", amount: 800, percentage: 16 },
    { category: "Contingencia", amount: 500, percentage: 10 },
    { category: "Tiempo del fundador (costo oportunidad)", amount: 1500, percentage: 30 },
  ],
  fundingStrategy: "Bootstrapped inicialmente. Ronda semilla pre-seed ($50K-$200K) después de validar beta con 10 empresas y MRR > $5K.",
}

export const aiStrategy: AiStrategy = {
  current: "Rule-based intent detection + templates contextuales. Sin dependencia de LLM externo para respuestas.",
  next: "Integrar GPT-4o y Claude Sonnet como modelos principales con router de tareas (complejas → GPT, rápidas → rule-based). Sistema RAG sobre la knowledge base.",
  vision: "Sistema multi-agente con agentes especializados, memory engine, knowledge graph, y modelo fine-tuned propio para terminología financiera y legal ecuatoriana.",
  models: [
    { name: "GPT-4o", useCase: "Análisis financiero complejo, razonamiento multi-paso, generación de informes", priority: "primary" },
    { name: "Claude Sonnet", useCase: "Análisis legal y normativo, revisión de documentos", priority: "primary" },
    { name: "Claude Haiku", useCase: "Tareas rápidas y económicas, extracción de datos", priority: "secondary" },
    { name: "Llama 4 (local)", useCase: "Procesamiento offline, datos sensibles, fallback", priority: "experimental" },
  ],
  knowledgeSources: [
    "Consulting DNA (reglas, umbrales, patrones, escalas)",
    "Knowledge Base (normativa ecuatoriana, metodologías, benchmarks)",
    "Memory Engine (conversaciones, decisiones, resultados por empresa)",
    "AuditLog (historial de acciones y cambios)",
    "Documentos y estados financieros de cada cliente",
  ],
  evaluationFramework: "Feedback score (1-5) por respuesta. Tasa de aceptación de recomendaciones. Precisión de detección de intención. Costo por análisis. Tiempo de respuesta.",
}
