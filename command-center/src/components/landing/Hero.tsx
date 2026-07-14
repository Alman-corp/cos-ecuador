"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Play } from "lucide-react"
import { GradientText } from "./GradientText"
import { DashboardMockup } from "@/components/due-diligence/DashboardMockup"

function DataMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cvs = canvasRef.current!
    const ctx = cvs.getContext("2d")!
    const fontSize = 14

    function resize() {
      cvs.width = window.innerWidth
      cvs.height = window.innerHeight
    }
    resize()

    const columns = Math.floor(cvs.width / fontSize)
    const drops: number[] = Array(columns).fill(1)

    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789"

    function draw() {
      ctx.fillStyle = "rgba(15, 23, 42, 0.05)"
      ctx.fillRect(0, 0, cvs.width, cvs.height)

      ctx.fillStyle = "#3b82f6"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle =
          Math.random() > 0.98
            ? "#60a5fa"
            : `rgba(59, 130, 246, ${0.15 + Math.random() * 0.2})`
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > cvs.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 50)
    window.addEventListener("resize", resize)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 opacity-30"
    />
  )
}

function FloatingBadge({
  text,
  position,
  delay,
}: {
  text: string
  position: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={`absolute hidden rounded-full border border-accent-500/20 bg-surface-900/80 px-3 py-1.5 text-xs font-medium text-surface-300 backdrop-blur-sm lg:block ${position}`}
    >
      {text}
    </motion.div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <DataMatrix />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1),transparent_60%)]" />

      <FloatingBadge
        text="⚡ Procesamiento en tiempo real"
        position="top-1/4 right-[15%]"
        delay={1.2}
      />
      <FloatingBadge
        text="🤖 IA Especializada por Industria"
        position="top-1/3 left-[10%]"
        delay={1.4}
      />
      <FloatingBadge
        text="🔒 Seguridad empresarial"
        position="bottom-1/3 right-[12%]"
        delay={1.6}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 pt-32 lg:flex-row lg:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-xs font-medium text-accent-400"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
            Plataforma de Inteligencia Estratégica
          </motion.div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Due Diligence
            <br />
            <GradientText>con inteligencia artificial</GradientText>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-surface-400 lg:mx-0">
            Automatiza el análisis financiero, detecta riesgos ocultos y genera
            informes de due diligence en minutos, no semanas.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
            <Link href="/due-diligence/new">
              <span className="flex items-center gap-2 rounded-xl bg-accent-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-600/25 transition-all hover:bg-accent-500 hover:shadow-accent-500/30 cursor-pointer">
                Nueva Due Diligence
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link href="/due-diligence/demo-001/analysis">
              <span className="flex items-center gap-2 rounded-xl border border-surface-700 bg-surface-800/50 px-6 py-3 text-sm font-medium text-surface-300 transition-colors hover:border-surface-600 hover:text-surface-100 cursor-pointer">
                <Play className="h-4 w-4" />
              Ver demo
              </span>
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-8 text-sm text-surface-500">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              SOC 2 Type II
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              GDPR Compliant
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              99.9% Uptime
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 flex-1 lg:mt-0"
        >
          <DashboardMockup />
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/20 to-transparent" />
    </section>
  )
}
