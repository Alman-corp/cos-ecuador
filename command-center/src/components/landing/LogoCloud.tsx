"use client"

import { motion } from "framer-motion"

const logos = [
  { name: "McKinsey & Co", color: "#3b82f6" },
  { name: "BCG", color: "#10b981" },
  { name: "Bain & Company", color: "#8b5cf6" },
  { name: "Deloitte", color: "#f59e0b" },
  { name: "EY", color: "#ef4444" },
  { name: "KPMG", color: "#06b6d4" },
]

export function LogoCloud() {
  return (
    <section className="border-y border-surface-800 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <p className="mb-8 text-center text-xs font-medium tracking-widest text-surface-500 uppercase">
          Empresas que ya transforman su estrategia
        </p>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-surface-900 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-surface-900 to-transparent" />

          <motion.div
            className="flex gap-16"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-3"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${logo.color}15` }}
                >
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: logo.color }}
                  />
                </div>
                <span className="text-sm font-semibold text-surface-500">
                  {logo.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
