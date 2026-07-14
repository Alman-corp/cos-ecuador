"use client"

import { motion } from "framer-motion"
import { SectionHeading } from "./SectionHeading"

const problems = [
  {
    title: "Excel Hell",
    description:
      "20 versiones del mismo archivo, fórmulas rotas, nadie sabe cuál es la fuente de verdad. Tu equipo pierde 12h/semana consolidando datos.",
    stat: "12h/semana",
    color: "#ef4444",
  },
  {
    title: "Conocimiento Fuga",
    description:
      "Cuando un consultor senior se va, se lleva décadas de expertise. No hay memoria institucional, cada proyecto empieza desde cero.",
    stat: "43%",
    color: "#f59e0b",
  },
  {
    title: "Escalamiento Artificial",
    description:
      "Por cada cliente nuevo contratas 2 personas. Tu P&L no escala, tu equipo se quema, y los márgenes se comprimen.",
    stat: "2:1",
    color: "#8b5cf6",
  },
]

export function ProblemSection() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          label="El Problema"
          title="La consultoría tradicional está rota"
          description="Mientras las startups escalan con tecnología, las firmas de consultoría siguen operando como en los 90."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="group relative overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/50 p-8 transition-colors hover:border-surface-700"
            >
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                style={{ backgroundColor: problem.color }}
              />

              <div
                className="mb-4 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `${problem.color}15`,
                  color: problem.color,
                }}
              >
                {problem.stat}
              </div>

              <h3 className="mb-3 text-lg font-semibold text-surface-100">
                {problem.title}
              </h3>
              <p className="text-sm leading-relaxed text-surface-400">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mx-auto mt-12 max-w-2xl rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center"
        >
          <p className="text-sm font-medium text-danger/80">
            <span className="font-bold text-danger">$2.3M</span> es el costo
            anual promedio de ineficiencia operativa en firmas de consultoría
            mid-market. (Fuente: HBR, 2024)
          </p>
        </motion.div>
      </div>
    </section>
  )
}
