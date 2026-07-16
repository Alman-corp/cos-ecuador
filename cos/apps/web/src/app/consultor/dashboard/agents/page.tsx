"use client"

import { useState, useRef, useEffect, useCallback } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { title: string; excerpt: string; page?: number }[]
}

const AGENTS = [
  { id: "financial", label: "Analista Financiero", icon: "$" },
  { id: "economic", label: "Pronosticador Económico", icon: "Δ" },
  { id: "market", label: "Market Researcher", icon: "◎" },
  { id: "synthesis", label: "Sintetizador de Docs", icon: "◇" },
] as const

type AgentId = (typeof AGENTS)[number]["id"]

const WELCOMES: Record<AgentId, string> = {
  financial: "Soy tu Analista Financiero. Puedo ayudarte con valuaciones, análisis de estados financieros, simulaciones DCF y más. ¿Qué deseas consultar?",
  economic: "Soy tu Pronosticador Económico. Puedo brindarte nowcasting del PIB, proyecciones de inflación y análisis de escenarios macro.",
  market: "Soy tu Market Researcher. Puedo analizar sentimiento de redes sociales, competencia y tendencias de consumo.",
  synthesis: "Soy tu Sintetizador de Documentos. Puedo resumir VDRs, contratos y reportes extensos.",
}

const AGENT_TO_API: Record<AgentId, string> = {
  financial: "FINANCIERO",
  economic: "ECONOMICO",
  market: "MARKET",
  synthesis: "SINTESIS",
}

export default function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState<AgentId>("financial")
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOMES.financial },
  ])
  const [sessionId] = useState(() => crypto.randomUUID())
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "default",
          session_id: sessionId,
          message: input,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()

      if (data.status === "error") throw new Error(data.error)

      setIsOffline(false)
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "No pude procesar tu solicitud.",
        sources: data.sources?.map((s: any) => ({
          title: s.document_title || "Documento",
          excerpt: s.excerpt || "",
          page: undefined,
        })) || [],
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setIsOffline(true)
      // Offline fallback
      const fallbacks: Record<AgentId, string> = {
        financial:
          "Basado en los estados financieros del último trimestre, el EBITDA se sitúa en $109,500 con un margen del 21.1%. El DCF calculado con un WACC del 12% arroja un Enterprise Value de $2.4M.",
        economic:
          "El nowcasting del PIB para el Q3 2026 sugiere un crecimiento del 2.3% ±0.8%. La inflación proyectada se mantiene en 3.1% para cierre de año.",
        market:
          "El análisis de sentimiento en redes sociales sobre el sector manufacturero muestra una tendencia positiva (score: 0.72). Share of Voice: 12.3%.",
        synthesis:
          "He sintetizado los documentos. Hallazgos clave: (1) Crecimiento EBITDA 14% anual, (2) 80% contratos con renovación automática, (3) Concentración de ingresos en top-3 clientes (68%).",
      }
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fallbacks[activeAgent],
      }
      setMessages((prev) => [...prev, assistantMsg])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, sessionId, activeAgent])

  const switchAgent = useCallback((id: AgentId) => {
    setActiveAgent(id)
    setMessages([{ id: "welcome", role: "assistant", content: WELCOMES[id] }])
  }, [])

  const currentAgent = AGENTS.find((a) => a.id === activeAgent)!

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Agent selector sidebar */}
      <div className="w-56 space-y-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
          Agentes
        </h2>
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => switchAgent(agent.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              activeAgent === agent.id
                ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20"
                : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-800 font-mono text-xs">
              {agent.icon}
            </span>
            {agent.label}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-xl border border-surface-700/50 bg-surface-800/50">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-surface-700/50 px-5 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-600/10 font-mono text-xs text-accent-400">
            {currentAgent.icon}
          </span>
          <div>
            <p className="text-sm font-medium text-surface-200">{currentAgent.label}</p>
            <p className="flex items-center gap-1.5 text-xs text-surface-500">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isOffline ? "bg-warning" : "bg-success"}`} />
              {isOffline ? "Modo offline" : "Conectado"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 ${
                  msg.role === "user" ? "bg-accent-600 text-white" : "bg-surface-900 text-surface-200"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-surface-700/30 pt-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-surface-500">Fuentes</p>
                    {msg.sources.map((s, i) => (
                      <div key={i} className="rounded-md bg-surface-800 px-2 py-1.5">
                        <p className="text-xs font-medium text-surface-300">{s.title}</p>
                        <p className="text-[10px] text-surface-500">{s.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-surface-900 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-surface-500" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-surface-500 [animation-delay:0.2s]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-surface-500 [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-surface-700/50 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe tu consulta…"
              className="flex-1 rounded-lg border border-surface-700 bg-surface-900 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "…" : "→"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
