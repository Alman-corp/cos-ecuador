"use client"

import { motion } from "framer-motion"
import { SectionHeading } from "./SectionHeading"

const testimonials = [
  {
    quote:
      "COS transformó nuestra práctica de advisory. Lo que solía tomar 3 semanas ahora lo hacemos en 2 días. Nuestros clientes notan la diferencia.",
    author: "María Fernanda López",
    role: "Socia Directora, ALTA Consultoría",
    metric: "85% faster delivery",
    metricColor: "#10b981",
  },
  {
    quote:
      "El módulo de stress testing nos permitió salvar a un cliente de una expansión catastrófica. COS vio lo que nosotros no vimos.",
    author: "Andrés Romero",
    role: "CFO, Grupo Empresarial del Norte",
    metric: "$4.2M saved",
    metricColor: "#3b82f6",
  },
  {
    quote:
      "La memoria institucional de COS es un game changer. Cuando un consultor se va, su conocimiento se queda. Ya no empezamos de cero.",
    author: "Patricia Vega",
    role: "COO, Vega & Asociados",
    metric: "Zero knowledge loss",
    metricColor: "#8b5cf6",
  },
]

export function Testimonials() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          label="Testimonios"
          title="Lo que dicen nuestros clientes"
          description="Resultados reales de firmas que ya operan con COS."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="group relative overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/50 p-8 transition-all hover:border-surface-700"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: t.metricColor }}
              />
              <div
                className="mb-4 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `${t.metricColor}15`,
                  color: t.metricColor,
                }}
              >
                {t.metric}
              </div>
              <p className="mb-6 text-sm leading-relaxed text-surface-300 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: t.metricColor }}
                >
                  {t.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-200">
                    {t.author}
                  </p>
                  <p className="text-xs text-surface-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
