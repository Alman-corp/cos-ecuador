"use client"

import { motion } from "framer-motion"
import {
  Brain,
  Search,
  Shield,
  Database,
  Lock,
  BarChart3,
  Layers,
  GitBranch,
  Zap,
} from "lucide-react"
import { SectionHeading } from "./SectionHeading"

const features = [
  {
    icon: Brain,
    title: "IA Especializada",
    description:
      "7 agentes de IA entrenados por dominio: financial, tax, legal, HR, risk, commercial y strategy.",
    color: "#3b82f6",
    span: "row-span-2",
  },
  {
    icon: Search,
    title: "RAG con Trazabilidad",
    description:
      "Iterative Source Decomposition. Cada respuesta cita el fragmento exacto del documento fuente.",
    color: "#8b5cf6",
  },
  {
    icon: Shield,
    title: "Memoria Institucional",
    description:
      "4 capas de memoria persistente: conversación, proyecto, cliente, firma.",
    color: "#10b981",
  },
  {
    icon: Database,
    title: "Vector Store",
    description:
      "Qdrant + embeddings OpenAI 3072d. Búsqueda semántica con reranking Cohere.",
    color: "#06b6d4",
  },
  {
    icon: Lock,
    title: "RLS Multi-tenant",
    description:
      "Row Level Security por cliente. Cada firma ve solo sus datos. GDPR nativo.",
    color: "#f59e0b",
  },
  {
    icon: BarChart3,
    title: "Reportes Automáticos",
    description:
      "CIM, Audit, Excel con fórmulas vivas. Generación en segundos, no días.",
    color: "#ef4444",
  },
  {
    icon: Layers,
    title: "4 Capas de Memoria",
    description:
      "Conversación → Proyecto → Cliente → Firma. Cada interacción mejora el sistema.",
    color: "#ec4899",
  },
  {
    icon: GitBranch,
    title: "Pipeline Modular",
    description:
      "Chunker, embedder, reranker, orchestrator. Cada pieza es reemplazable.",
    color: "#14b8a6",
  },
  {
    icon: Zap,
    title: "Stress Simulator",
    description:
      "Proyecta caja, EBITDA y liquidity bajo escenarios pesimista, base y optimista.",
    color: "#f97316",
  },
]

export function FeaturesBento() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          label="Plataforma"
          title="Inteligencia integral para tu firma"
          description="Cada funcionalidad está diseñada para eliminar fricción y potenciar el juicio del consultor."
        />

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[180px]">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={`group relative overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/50 p-6 transition-all hover:border-surface-700 hover:bg-surface-900/80 ${
                feature.span === "row-span-2" ? "sm:row-span-2" : ""
              }`}
            >
              <div
                className="absolute -inset-px rounded-2xl opacity-0 blur-sm transition-opacity group-hover:opacity-50"
                style={{
                  background: `radial-gradient(400px at 50% 50%, ${feature.color}15, transparent)`,
                }}
              />
              <div className="relative z-10 flex h-full flex-col">
                <div
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon
                    className="h-5 w-5"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-surface-200">
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed text-surface-400">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
