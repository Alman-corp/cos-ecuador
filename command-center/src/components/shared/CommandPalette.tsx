"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

interface Command {
  id: string
  label: string
  description: string
  action: () => void
  shortcut?: string
}

const DEFAULT_COMMANDS: Command[] = [
  { id: "go-dashboard", label: "Ir al Dashboard", description: "Vista principal con KPIs", action: () => {}, shortcut: "G D" },
  { id: "go-margins", label: "Ir a Márgenes", description: "Análisis de márgenes y P&L", action: () => {}, shortcut: "G M" },
  { id: "go-valuation", label: "Ir a Valuación", description: "DCF y Monte Carlo", action: () => {}, shortcut: "G V" },
  { id: "go-stress", label: "Ir a Simulador de Estrés", description: "Proyecciones y escenarios", action: () => {}, shortcut: "G S" },
  { id: "go-datahub", label: "Ir a Data Hub", description: "Importación de datos", action: () => {}, shortcut: "G H" },
  { id: "go-agents", label: "Ir a Agentes", description: "Chat con agentes analíticos", action: () => {}, shortcut: "G A" },
  { id: "whatif", label: "Activar What-If", description: "Editar KPIs y ver impacto en tiempo real", action: () => {} },
  { id: "presentation", label: "Modo Presentación", description: "Pantalla completa sin distracciones", action: () => {} },
]

interface Props {
  onWhatIf?: () => void
  onPresentation?: () => void
}

export function CommandPalette({ onWhatIf, onPresentation }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const commands: Command[] = DEFAULT_COMMANDS.map((cmd) => {
    const c = { ...cmd }
    if (cmd.id === "go-dashboard") c.action = () => router.push("/dashboard")
    if (cmd.id === "go-margins") c.action = () => router.push("/margins")
    if (cmd.id === "go-valuation") c.action = () => router.push("/valuation")
    if (cmd.id === "go-stress") c.action = () => router.push("/stress-simulator")
    if (cmd.id === "go-datahub") c.action = () => router.push("/data-hub")
    if (cmd.id === "go-agents") c.action = () => router.push("/agents")
    if (cmd.id === "whatif") c.action = () => { onWhatIf?.(); setOpen(false) }
    if (cmd.id === "presentation") c.action = () => { onPresentation?.(); setOpen(false) }
    return c
  })

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)) }
      if (e.key === "Enter" && filtered[selectedIdx]) {
        filtered[selectedIdx].action()
        setOpen(false)
      }
    },
    [filtered, selectedIdx]
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg rounded-xl border border-surface-600 bg-surface-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-surface-700/50 px-4 py-3">
              <svg className="h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar comandos…"
                className="flex-1 bg-transparent text-sm text-surface-100 outline-none placeholder:text-surface-500"
              />
              <kbd className="rounded bg-surface-700 px-1.5 py-0.5 text-[10px] font-mono text-surface-400">ESC</kbd>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-surface-500">Sin resultados para &ldquo;{query}&rdquo;</p>
              )}
              {filtered.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); setOpen(false) }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    idx === selectedIdx ? "bg-accent-600/20 text-accent-400" : "text-surface-300 hover:bg-surface-700/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cmd.label}</p>
                    <p className="text-xs text-surface-500 truncate">{cmd.description}</p>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="shrink-0 rounded bg-surface-700 px-1.5 py-0.5 text-[10px] font-mono text-surface-400">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
