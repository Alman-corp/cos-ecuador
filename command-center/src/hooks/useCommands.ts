"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

export interface SlashCommand {
  id: string
  label: string
  description: string
  icon: string
  category: "nav" | "action" | "view"
  action: () => void
  aliases?: string[]
}

interface UseCommandsOptions {
  onWhatIf?: () => void
  onPresentation?: () => void
  onExportPDF?: () => void
  onClearChat?: () => void
}

export function useCommands(options: UseCommandsOptions = {}) {
  const router = useRouter()
  const [activeCommand, setActiveCommand] = useState<string | null>(null)

  const commands: SlashCommand[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "/dashboard",
        description: "Ir al dashboard principal",
        icon: "📊",
        category: "nav",
        action: () => router.push("/dashboard"),
        aliases: ["/dash", "/home"],
      },
      {
        id: "valuation",
        label: "/valuation",
        description: "Abrir valuación DCF",
        icon: "💰",
        category: "nav",
        action: () => router.push("/valuation"),
        aliases: ["/dcf", "/valuacion"],
      },
      {
        id: "stress",
        label: "/stress",
        description: "Simulador de estrés",
        icon: "⚡",
        category: "nav",
        action: () => router.push("/stress-simulator"),
        aliases: ["/simulador", "/escenarios"],
      },
      {
        id: "margins",
        label: "/margins",
        description: "Análisis de márgenes",
        icon: "📈",
        category: "nav",
        action: () => router.push("/margins"),
        aliases: ["/margenes", "/pnl"],
      },
      {
        id: "datahub",
        label: "/datahub",
        description: "Centro de datos",
        icon: "🗄️",
        category: "nav",
        action: () => router.push("/data-hub"),
        aliases: ["/datos", "/import"],
      },
      {
        id: "agents",
        label: "/agents",
        description: "Agentes de IA",
        icon: "🤖",
        category: "nav",
        action: () => router.push("/agents"),
        aliases: ["/chat", "/agentes"],
      },
      {
        id: "whatif",
        label: "/what-if",
        description: "Activar modo What-If",
        icon: "✏️",
        category: "action",
        action: () => options.onWhatIf?.(),
        aliases: ["/simular", "/escenario"],
      },
      {
        id: "present",
        label: "/present",
        description: "Modo presentación",
        icon: "🎬",
        category: "view",
        action: () => options.onPresentation?.(),
        aliases: ["/fullscreen", "/pantalla"],
      },
      {
        id: "export",
        label: "/export",
        description: "Exportar PDF",
        icon: "📄",
        category: "action",
        action: () => options.onExportPDF?.(),
        aliases: ["/pdf", "/descargar"],
      },
      {
        id: "clear",
        label: "/clear",
        description: "Limpiar historial del chat",
        icon: "🗑️",
        category: "action",
        action: () => options.onClearChat?.(),
        aliases: ["/reset", "/nueva"],
      },
    ],
    [router, options]
  )

  const matchCommand = useCallback(
    (query: string): SlashCommand | null => {
      const lower = query.toLowerCase().trim()
      return (
        commands.find(
          (cmd) =>
            cmd.label === lower ||
            cmd.aliases?.some((alias) => alias === lower)
        ) ?? null
      )
    },
    [commands]
  )

  const filterCommands = useCallback(
    (prefix: string): SlashCommand[] => {
      const lower = prefix.toLowerCase()
      return commands.filter(
        (cmd) =>
          cmd.label.startsWith(lower) ||
          cmd.category.startsWith(lower) ||
          cmd.description.toLowerCase().includes(lower) ||
          cmd.aliases?.some((a) => a.startsWith(lower))
      )
    },
    [commands]
  )

  return {
    commands,
    activeCommand,
    setActiveCommand,
    matchCommand,
    filterCommands,
  }
}
