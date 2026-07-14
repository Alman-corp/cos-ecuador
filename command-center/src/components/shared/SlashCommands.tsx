"use client"

import { useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { SlashCommand } from "@/hooks/useCommands"

interface SlashCommandsProps {
  commands: SlashCommand[]
  visible: boolean
  selectedIndex: number
  onSelect: (command: SlashCommand) => void
  onHighlight: (index: number) => void
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  nav: "Navegación",
  action: "Acciones",
  view: "Vista",
}

export function SlashCommands({
  commands,
  visible,
  selectedIndex,
  onSelect,
  onHighlight,
  onClose,
}: SlashCommandsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (visible && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex, visible])

  const grouped = commands.reduce(
    (acc, cmd) => {
      const cat = cmd.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(cmd)
      return acc
    },
    {} as Record<string, SlashCommand[]>
  )

  const flatList = commands

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        onHighlight(Math.min(selectedIndex + 1, flatList.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        onHighlight(Math.max(selectedIndex - 1, 0))
      }
      if (e.key === "Enter" && flatList[selectedIndex]) {
        e.preventDefault()
        onSelect(flatList[selectedIndex])
      }
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    },
    [visible, selectedIndex, flatList, onHighlight, onSelect, onClose]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!visible || commands.length === 0) return null

  let flatIndex = -1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.12 }}
        className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-64 overflow-y-auto rounded-xl border border-surface-600 bg-surface-800 shadow-2xl"
        ref={listRef}
      >
        <div className="px-3 py-2 border-b border-surface-700/50">
          <p className="text-[10px] font-medium uppercase tracking-wider text-surface-500">
            Comandos — escribe para filtrar
          </p>
        </div>

        {Object.entries(grouped).map(([category, cmds]) => (
          <div key={category}>
            <p className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-wider text-surface-600">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            {cmds.map((cmd) => {
              flatIndex++
              const idx = flatIndex
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={cmd.id}
                  ref={(el) => { itemRefs.current[idx] = el }}
                  onClick={() => onSelect(cmd)}
                  onMouseEnter={() => onHighlight(idx)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "bg-accent-600/20 text-accent-400"
                      : "text-surface-300 hover:bg-surface-700/50"
                  }`}
                >
                  <span className="text-sm">{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium font-mono">{cmd.label}</p>
                    <p className="text-[10px] text-surface-500 truncate">
                      {cmd.description}
                    </p>
                  </div>
                  {cmd.aliases && cmd.aliases.length > 0 && (
                    <span className="text-[9px] text-surface-600 shrink-0">
                      {cmd.aliases[0]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
