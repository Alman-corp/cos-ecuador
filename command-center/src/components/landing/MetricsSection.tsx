"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, value)
      setDisplay(Math.round(current))
      if (step >= steps) {
        clearInterval(timer)
        setDisplay(value)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isInView, value])

  const formatted = value >= 1000 ? `${(display / 1000).toFixed(1)}k` : display

  return (
    <span ref={ref} className="tabular-nums">
      {formatted}
      {suffix}
    </span>
  )
}

const metrics = [
  { value: 150000, label: "Horas de consultoría optimizadas", suffix: "+" },
  { value: 340, label: "Proyectos entregados", suffix: "+" },
  { value: 98, label: "Satisfacción del cliente", suffix: "%" },
  { value: 12, label: "Países con presencia", suffix: "" },
]

export function MetricsSection() {
  return (
    <section className="relative border-y border-surface-800 py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="text-center"
            >
              <div className="text-4xl font-bold tracking-tight text-surface-50">
                <AnimatedNumber value={metric.value} suffix={metric.suffix} />
              </div>
              <p className="mt-2 text-sm text-surface-400">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mx-auto mt-16 max-w-2xl rounded-2xl border border-surface-800 bg-surface-900/50 p-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/10">
              <svg className="h-5 w-5 text-accent-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm leading-relaxed text-surface-300 italic">
                &ldquo;COS nos permitió escalar de 12 a 45 clientes sin
                contratar un solo consultor adicional. Nuestros márgenes EBITDA
                pasaron de 22% a 41% en 18 meses.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accent-600/20" />
                <div>
                  <p className="text-xs font-medium text-surface-200">
                    Carlos Mendoza
                  </p>
                  <p className="text-xs text-surface-500">
                    CEO, Mendoza Consulting Group
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
