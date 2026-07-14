"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Shield, Clock, HeadphonesIcon } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-32" id="demo">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_60%)]" />
        <motion.div
          className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-accent-500/5 blur-3xl"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl"
          animate={{
            x: [0, -20, 30, 0],
            y: [0, 20, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-block rounded-full border border-accent-500/20 bg-accent-500/10 px-3 py-1 text-xs font-medium tracking-wider text-accent-400 uppercase">
            Comienza hoy
          </span>

          <h2 className="text-4xl font-bold tracking-tight text-surface-50 sm:text-5xl">
            Tu firma merece
            <br />
            inteligencia de clase mundial
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-surface-400">
            Únete a las firmas que ya están transformando su operación con COS.
            Demo personalizada sin compromiso.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/login">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-accent-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-accent-600/25 transition-all hover:bg-accent-500 hover:shadow-accent-500/30 cursor-pointer"
              >
                Ir al Dashboard
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Link>

            <Link href="/dashboard">
              <span className="flex items-center gap-2 rounded-xl border border-surface-700 bg-surface-800/50 px-8 py-4 text-sm font-medium text-surface-300 transition-colors hover:border-surface-600 hover:text-surface-100 cursor-pointer">
                Ver plataforma
              </span>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-surface-500">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent-400" />
              SLA 99.9% uptime garantizado
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent-400" />
              Onboarding en 48 horas
            </span>
            <span className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4 text-accent-400" />
              Soporte 24/7 dedicado
            </span>
          </div>

          <div className="mt-12 border-t border-surface-800 pt-8">
            <p className="text-xs text-surface-600">
              ⚡ Ya{" "}
              <span className="font-semibold text-surface-400">340+</span>{" "}
              firmas confían en COS ·{" "}
              <span className="font-semibold text-surface-400">98%</span>{" "}
              satisfacción · Implementación promedio:{" "}
              <span className="font-semibold text-surface-400">48 horas</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
