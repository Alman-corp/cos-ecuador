"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { SectionHeading } from "./SectionHeading"

const layers = [
  {
    title: "Frontend",
    subtitle: "Next.js 19 · React 19 · Tailwind v4",
    items: [
      "Dashboard ejecutivo en tiempo real",
      "Portal cliente con KPIs dinámicos",
      "Kanban pipeline drag & drop",
      "Reportes PDF generados con React-PDF",
    ],
    color: "#3b82f6",
  },
  {
    title: "API Layer",
    subtitle: "Next.js API Routes · tRPC",
    items: [
      "Endpoints REST optimizados",
      "Validación Zod + TypeScript",
      "Server Components first",
      "Streaming SSR progresivo",
    ],
    color: "#8b5cf6",
  },
  {
    title: "Microservicios",
    subtitle: "FastAPI · Celery · Redis",
    items: [
      "Orquestador RAG con ISD",
      "7 agentes especializados por dominio",
      "Pipeline de procesamiento async",
      "Cola de tareas distribuida",
    ],
    color: "#10b981",
  },
  {
    title: "AI / ML",
    subtitle: "OpenAI · Qdrant · Cohere",
    items: [
      "Embeddings 3072 dimensiones",
      "Reranking semántico",
      "Memoria persistente 4 capas",
      "Chunking estratégico adaptativo",
    ],
    color: "#06b6d4",
  },
  {
    title: "Datos",
    subtitle: "PostgreSQL · Supabase · Prisma",
    items: [
      "Esquema multi-tenant RLS",
      "Migrations automatizadas",
      "Real-time subscriptions",
      "Audit logging completo",
    ],
    color: "#f59e0b",
  },
  {
    title: "Seguridad",
    subtitle: "SOC 2 · GDPR · RLS",
    items: [
      "Autenticación Supabase SSR",
      "Row Level Security por tenant",
      "Cifrado en reposo y tránsito",
      "Auditoría de acceso continua",
    ],
    color: "#ef4444",
  },
]

export function ArchitectureSection() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  return (
    <section ref={sectionRef} className="relative py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          label="Arquitectura"
          title="Ingeniería moderna, resultados reales"
          description="Cada capa está diseñada para escalar horizontalmente y mantener consistencia."
        />

        <div className="relative mx-auto max-w-3xl">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-surface-800" />
          <motion.div
            className="absolute left-6 top-0 w-px bg-gradient-to-b from-accent-500 via-accent-400 to-accent-500"
            style={{ height: lineHeight }}
          />

          <div className="space-y-6">
            {layers.map((layer, i) => (
              <motion.div
                key={layer.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative pl-14"
              >
                <div
                  className="absolute left-3.5 top-3 h-5 w-5 rounded-full border-2"
                  style={{
                    borderColor: layer.color,
                    backgroundColor: activeLayer === i ? layer.color : "transparent",
                  }}
                />

                <div
                  className="cursor-pointer rounded-2xl border border-surface-800 bg-surface-900/50 p-6 transition-all hover:border-surface-700"
                  onClick={() =>
                    setActiveLayer(activeLayer === i ? null : i)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className="mb-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                        style={{
                          backgroundColor: `${layer.color}15`,
                          color: layer.color,
                        }}
                      >
                        Layer {i + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-surface-100">
                        {layer.title}
                      </h3>
                      <p className="text-sm text-surface-500">
                        {layer.subtitle}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: activeLayer === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-surface-500"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {activeLayer === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-4 space-y-2 border-t border-surface-800 pt-4">
                          {layer.items.map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-2 text-sm text-surface-400"
                            >
                              <span
                                className="h-1 w-1 rounded-full"
                                style={{ backgroundColor: layer.color }}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
