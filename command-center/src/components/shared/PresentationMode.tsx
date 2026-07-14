"use client"

import { useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  active: boolean
  onToggle: () => void
}

export function PresentationMode({ active, onToggle }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) onToggle()
    },
    [active, onToggle]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  useEffect(() => {
    if (active) {
      document.body.classList.add("is-presentation")
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.body.classList.remove("is-presentation")
      if (document.fullscreenElement) document.exitFullscreen?.()
    }
    return () => {
      document.body.classList.remove("is-presentation")
    }
  }, [active])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-full border border-surface-600 bg-surface-800/90 px-4 py-2 shadow-xl backdrop-blur-md">
            <span className="text-xs text-surface-400">🎬 Modo Presentación</span>
            <button
              onClick={onToggle}
              className="rounded-full bg-surface-700 px-3 py-1 text-xs font-medium text-surface-200 hover:bg-surface-600 transition-colors"
            >
              Salir (ESC)
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
