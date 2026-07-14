"use client"

import { motion } from "framer-motion"
import { CheckCircle2, XCircle } from "lucide-react"
import { SectionHeading } from "./SectionHeading"

const before = [
  "Spreadsheets sin control de versiones",
  "Reuniones interminables de status",
  "Entregables inconsistentes",
  "Onboarding de 3 meses por proyecto",
  "Sin visibilidad en tiempo real",
]

const after = [
  "Datos centralizados y siempre actualizados",
  "Automation de reportes y alerts",
  "Outputs estandarizados con IA",
  "Onboarding en 48 horas",
  "Dashboards en vivo para clientes",
]

export function SolutionSection() {
  return (
    <section className="relative py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4">
        <SectionHeading
          label="La Solución"
          title="COS: Tu fuerza laboral aumentada"
          description="No reemplazamos consultores. Eliminamos la fricción operativa para que se concentren en lo que importa."
        />

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-surface-800 bg-surface-900/50 p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-danger" />
              <h3 className="text-lg font-semibold text-surface-200">
                Sin COS
              </h3>
            </div>
            <ul className="space-y-4">
              {before.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-surface-400">
                  <span className="mt-0.5 text-danger/60">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-accent-500/20 bg-accent-500/5 p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent-400" />
              <h3 className="text-lg font-semibold text-accent-200">
                Con COS
              </h3>
            </div>
            <ul className="space-y-4">
              {after.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-surface-300">
                  <span className="mt-0.5 text-accent-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mx-auto mt-10 max-w-lg text-center"
        >
          <span className="inline-block rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-2 text-sm font-medium text-accent-400">
            3x capacidad de entrega · 2x márgenes · mismo equipo
          </span>
        </motion.div>
      </div>
    </section>
  )
}
