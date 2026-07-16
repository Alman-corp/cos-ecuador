import type { MaturityScale } from "./types"

export const maturityScales: MaturityScale[] = [
  {
    id: "mat-fin-001",
    name: "Madurez Financiera",
    category: "profitability",
    levels: [
      {
        level: 1,
        label: "Inicial",
        description: "Gestión financiera reactiva, sin planificación ni control presupuestario.",
        criteria: [
          "No existe presupuesto formal",
          "Estados financieros se preparan solo por obligación tributaria",
          "No hay separación entre finanzas personales y empresariales",
          "Decisiones financieras basadas en intuición",
        ],
      },
      {
        level: 2,
        label: "Básico",
        description: "Control financiero básico con herramientas simples.",
        criteria: [
          "Presupuesto anual simple",
          "Conciliaciones bancarias regulares",
          "Flujo de caja proyectado mensualmente",
          "Indicadores financieros básicos calculados",
        ],
      },
      {
        level: 3,
        label: "Estandarizado",
        description: "Procesos financieros definidos y métricas establecidas.",
        criteria: [
          "Sistema contable implementado",
          "Reportes financieros mensuales con análisis de variaciones",
          "Ratios financieros monitoreados regularmente",
          "Planificación tributaria activa",
        ],
      },
      {
        level: 4,
        label: "Avanzado",
        description: "Gestión financiera proactiva con análisis predictivo.",
        criteria: [
          "Modelos financieros con escenarios y sensibilidad",
          "Análisis de rentabilidad por unidad de negocio",
          "Gestión de riesgos financieros formalizada",
          "Dashboard financiero en tiempo real",
        ],
      },
      {
        level: 5,
        label: "Óptimo",
        description: "Excelencia en gestión financiera con creación de valor demostrable.",
        criteria: [
          "ROE consistentemente superior al WACC",
          "Optimización de estructura de capital",
          "Gestión de valor (VBM) implementada",
          "Benchmarking continuo con mejores prácticas del sector",
        ],
      },
    ],
  },
  {
    id: "mat-dig-001",
    name: "Madurez Digital",
    category: "digital",
    levels: [
      {
        level: 1,
        label: "Analógico",
        description: "Procesos predominantemente manuales y en papel.",
        criteria: [
          "Sin sistemas informáticos integrados",
          "Procesos manuales y en papel",
          "Comunicación interna no estructurada",
          "Sin presencia digital",
        ],
      },
      {
        level: 2,
        label: "Emergente",
        description: "Digitalización básica de procesos críticos.",
        criteria: [
          "Sistema contable básico",
          "Correo electrónico como herramienta principal",
          "Página web informativa",
          "Algunos procesos digitalizados",
        ],
      },
      {
        level: 3,
        label: "Integrado",
        description: "Sistemas digitales integrados con procesos definidos.",
        criteria: [
          "ERP implementado en áreas clave",
          "CRM para gestión de clientes",
          "Facturación electrónica",
          "Procesos documentados y digitalizados",
        ],
      },
      {
        level: 4,
        label: "Avanzado",
        description: "Digitalización integral con automatización y数据分析.",
        criteria: [
          "ERP integral conectando todas las áreas",
          "Automatización de procesos (RPA)",
          "Analítica de datos para toma de decisiones",
          "Integración con API de entidades externas",
        ],
      },
      {
        level: 5,
        label: "Transformado",
        description: "Cultura digital con innovación continua y ventaja competitiva digital.",
        criteria: [
          "IA y machine learning integrados en procesos clave",
          "Cultura de innovación digital establecida",
          "Modelo de negocio potenciado por tecnología",
          "Liderazgo digital reconocido en el sector",
        ],
      },
    ],
  },
  {
    id: "mat-ops-001",
    name: "Madurez Operativa",
    category: "operational",
    levels: [
      {
        level: 1,
        label: "Caótico",
        description: "Procesos no definidos, operación reactiva.",
        criteria: [
          "Procesos no documentados",
          "Dueño hace todo",
          "Sin métricas operativas",
          "Incumplimientos frecuentes",
        ],
      },
      {
        level: 2,
        label: "Repetible",
        description: "Procesos básicos documentados pero no estandarizados.",
        criteria: [
          "Algunos procesos documentados",
          "Roles básicos definidos",
          "Métricas operativas incipientes",
          "Cumplimiento irregular",
        ],
      },
      {
        level: 3,
        label: "Definido",
        description: "Procesos estandarizados y métricas establecidas.",
        criteria: [
          "Procesos documentados y comunicados",
          "Indicadores clave de desempeño (KPI)",
          "Revisiones periódicas de proceso",
          "Mejora continua implementada",
        ],
      },
      {
        level: 4,
        label: "Gestionado",
        description: "Procesos medidos y controlados con mejora continua.",
        criteria: [
          "Control estadístico de procesos",
          "Metas y objetivos cuantitativos",
          "Gestión por procesos establecida",
          "Auditorías internas regulares",
        ],
      },
      {
        level: 5,
        label: "Optimizado",
        description: "Excelencia operativa con innovación en procesos.",
        criteria: [
          "Mejora continua institucionalizada",
          "Benchmarking externo regular",
          "Innovación en procesos documentada",
          "Resultados consistentemente superiores",
        ],
      },
    ],
  },
  {
    id: "mat-str-001",
    name: "Madurez Estratégica",
    category: "strategic",
    levels: [
      {
        level: 1,
        label: "Sin Estrategia",
        description: "Operación sin dirección estratégica clara.",
        criteria: [
          "Sin misión, visión ni valores definidos",
          "Decisiones exclusivamente reactivas",
          "Sin análisis competitivo",
          "Objetivos no definidos",
        ],
      },
      {
        level: 2,
        label: "Emergente",
        description: "Estrategia implícita pero no formalizada.",
        criteria: [
          "Misión y visión definidas pero no comunicadas",
          "Análisis FODA ocasional",
          "Objetivos generales sin métricas",
          "Estrategia en la mente del dueño",
        ],
      },
      {
        level: 3,
        label: "Formalizada",
        description: "Estrategia documentada con planes y métricas.",
        criteria: [
          "Plan estratégico documentado",
          "Objetivos con KPIs y metas",
          "Revisión estratégica trimestral",
          "Análisis competitivo regular",
        ],
      },
      {
        level: 4,
        label: "Ejecutada",
        description: "Estrategia implementada con seguimiento y ajustes.",
        criteria: [
          "Cascada de objetivos en toda la organización",
          "OKRs implementados",
          "Reuniones estratégicas mensuales",
          "Presupuesto alineado a estrategia",
        ],
      },
      {
        level: 5,
        label: "Adaptativa",
        description: "Organización que aprende y se adapta continuamente.",
        criteria: [
          "Estrategia dinámica con ajustes en tiempo real",
          "Innovación estratégica continua",
          "Ventaja competitiva sostenible demostrada",
          "Cultura estratégica en todos los niveles",
        ],
      },
    ],
  },
  {
    id: "mat-comp-001",
    name: "Madurez de Cumplimiento",
    category: "compliance",
    levels: [
      {
        level: 1,
        label: "Incumplimiento",
        description: "Desconocimiento e incumplimiento de obligaciones.",
        criteria: [
          "Declaraciones tributarias inconsistentes",
          "Sin registros contables formales",
          "Obligaciones laborales no regularizadas",
          "Riesgo de multas y sanciones",
        ],
      },
      {
        level: 2,
        label: "Cumplimiento Básico",
        description: "Cumplimiento mínimo de obligaciones legales.",
        criteria: [
          "Declaraciones tributarias al día",
          "Contabilidad formal pero básica",
          "Obligaciones laborales básicas cumplidas",
          "Sin planificación tributaria",
        ],
      },
      {
        level: 3,
        label: "Cumplimiento Sistemático",
        description: "Procesos de cumplimiento establecidos y monitoreados.",
        criteria: [
          "Calendario tributario implementado",
          "Revisión de cumplimiento mensual",
          "Asesoría legal y tributaria permanente",
          "Controles internos básicos",
        ],
      },
      {
        level: 4,
        label: "Cumplimiento Avanzado",
        description: "Gestión proactiva de cumplimiento con planificación.",
        criteria: [
          "Planificación tributaria estratégica",
          " Auditorías internas regulares",
          "Matriz de cumplimiento legal completa",
          "Reporting a dirección",
        ],
      },
      {
        level: 5,
        label: "Excelencia en Cumplimiento",
        description: "Cultura de cumplimiento con gestión de riesgos legal y reputacional.",
        criteria: [
          "Gobierno de cumplimiento formalizado",
          "Monitoreo continuo de cambios normativos",
          "Cultura de compliance en toda la organización",
          "Certificaciones y estándares internacionales",
        ],
      },
    ],
  },
]
