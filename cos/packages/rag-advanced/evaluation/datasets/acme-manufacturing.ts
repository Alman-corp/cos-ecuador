import type { GoldenQA } from "../types"

export const ACME_MANUFACTURING_DATASET: GoldenQA[] = [
  {
    question: "¿Cuál fue el EBITDA de Tesla en FY 2025 y cómo cambió respecto al año anterior?",
    ground_truth_answer: "El EBITDA de Tesla en FY 2025 fue de $14.6B, una disminución del 9.1% respecto a los $16.1B de FY 2024.",
    ground_truth_contexts: [
      { document_id: "tesla-fy2025", chunk_id: "chunk-income-statement", page: 3 },
      { document_id: "tesla-fy2025", chunk_id: "chunk-ebitda", page: 4 },
    ],
    difficulty: "easy",
    category: "financial",
  },
  {
    question: "Compare el margen bruto de Tesla en Q4 2025 contra el margen bruto de FY 2025 completo.",
    ground_truth_answer: "El margen bruto en Q4 2025 fue de aproximadamente 17.0%, mientras que el margen bruto de FY 2025 completo fue de 18.0%.",
    ground_truth_contexts: [
      { document_id: "tesla-fy2025", chunk_id: "chunk-margins", page: 5 },
      { document_id: "tesla-q4-2025", chunk_id: "chunk-q4-gross-margin", page: 2, cell_ref: "B15" },
    ],
    difficulty: "medium",
    category: "financial",
  },
  {
    question: "¿Cómo impactó el crecimiento del negocio de Energy Storage en los ingresos totales de Tesla?",
    ground_truth_answer: "Energy Storage creció 85% YoY a $2.1B en ingresos, contribuyendo positivamente a la mezcla de ingresos aunque el segmento automotriz sigue siendo dominante.",
    ground_truth_contexts: [
      { document_id: "tesla-fy2025", chunk_id: "chunk-energy-storage", page: 7 },
      { document_id: "tesla-fy2025", chunk_id: "chunk-segment-results", page: 6 },
    ],
    difficulty: "medium",
    category: "operational",
  },
  {
    question: "¿Cuál es la estrategia de Tesla para mejorar sus márgenes operativos dado el entorno competitivo?",
    ground_truth_answer: "Tesla está ejecutando el Project Maverick de optimización de costos, reduciendo SG&A a 6.9% de ingresos (vs 8.2% en Q4 2024) y mejorando la eficiencia de producción en Gigafactories.",
    ground_truth_contexts: [
      { document_id: "tesla-fy2025", chunk_id: "chunk-cost-optimization", page: 9 },
      { document_id: "tesla-fy2025", chunk_id: "chunk-sga", page: 8 },
    ],
    difficulty: "hard",
    category: "strategic",
  },
  {
    question: "¿Cuál es el flujo de caja libre de Tesla y cómo se compara con el CAPEX?",
    ground_truth_answer: "El FCF de Tesla en FY 2025 fue de $6.2B, con un CAPEX de $8.5B y un flujo de caja operativo de $14.7B.",
    ground_truth_contexts: [
      { document_id: "tesla-fy2025", chunk_id: "chunk-cash-flow", page: 10 },
      { document_id: "tesla-fy2025", chunk_id: "chunk-capex", page: 11 },
    ],
    difficulty: "easy",
    category: "financial",
  },
  {
    question: "Describa la posición de caja de Tesla y su capacidad para financiar crecimiento futuro.",
    ground_truth_answer: "Tesla tiene $44.1B en efectivo e inversiones, con una deuda total de $8.4B, resultando en una caja neta de $35.7B. Esto proporciona un colchón excepcional para financiar crecimiento en nuevas capacidades de producción, desarrollo de FSD, y expansión de Energy Storage.",
    ground_truth_contexts: [
      { document_id: "tesla-fy2025", chunk_id: "chunk-cash-position", page: 12 },
      { document_id: "tesla-fy2025", chunk_id: "chunk-balance-sheet", page: 13 },
    ],
    difficulty: "medium",
    category: "financial",
  },
  {
    question: "¿Qué métricas de cumplimiento regulatorio y ESG reportó Tesla en FY 2025?",
    ground_truth_answer: "Tesla reportó una reducción del 15% en emisiones de CO2 por vehículo producido, alcanzó el 100% de energía renovable en sus operaciones de manufacturing, y cumplió con todos los estándares de seguridad functional (ISO 26262) para FSD Supervised.",
    ground_truth_contexts: [
      { document_id: "tesla-fy2025", chunk_id: "chunk-esg", page: 25 },
      { document_id: "tesla-fy2025", chunk_id: "chunk-regulatory", page: 26 },
    ],
    difficulty: "medium",
    category: "compliance",
  },
]
