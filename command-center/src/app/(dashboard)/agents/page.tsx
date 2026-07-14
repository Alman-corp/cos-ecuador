"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useChatMemory, type ChatMessage } from "@/hooks/useChatMemory"
import { type ModelTier } from "@/lib/model-router"
import { useCommands } from "@/hooks/useCommands"
import { SlashCommands } from "@/components/shared/SlashCommands"
import { Skeleton } from "@/components/ui/skeleton"
import { useAgentsQuery } from "@/lib/hooks/use-agents-query"
import type { AgentStatus } from "@/lib/shared-types"

const AGENTS = [
  { id: "financial", label: "Analista Financiero", icon: "$", color: "text-accent-400" },
  { id: "economic", label: "Pronosticador Económico", icon: "Δ", color: "text-emerald-400" },
  { id: "market", label: "Market Researcher", icon: "◎", color: "text-amber-400" },
  { id: "synthesis", label: "Sintetizador de Docs", icon: "◇", color: "text-surface-300" },
] as const
type AgentId = (typeof AGENTS)[number]["id"]

function ModelBadge({ tier }: { tier?: ModelTier }) {
  if (!tier) return null
  const colors: Record<ModelTier, string> = { haiku: "bg-blue-600/10 text-blue-400", sonnet: "bg-purple-600/10 text-purple-400", opus: "bg-amber-600/10 text-amber-400" }
  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-medium ${colors[tier]}`}>{tier.toUpperCase()}</span>
}

function ToolCallDisplay({ tools }: { tools: NonNullable<ChatMessage["tools"]> }) {
  return (
    <div className="mt-2 space-y-1">
      {tools.map((t) => (
        <div key={t.id} className="flex items-center gap-2 text-[10px] font-mono">
          <span className={`shrink-0 ${t.status === "running" ? "text-accent-400" : t.status === "error" ? "text-red-400" : "text-emerald-400"}`}>
            {t.status === "running" ? "◌" : t.status === "error" ? "✕" : "✓"}
          </span>
          <span className="text-surface-400">{t.name}</span>
          {t.params && Object.keys(t.params).length > 0 && (
            <span className="text-surface-600">{JSON.stringify(t.params).slice(0, 60)}</span>
          )}
          {t.status === "running" && <span className="text-accent-400 animate-pulse">procesando…</span>}
          {t.result && <span className="text-surface-500 truncate">{t.result}</span>}
          {t.error && <span className="text-red-400">{t.error}</span>}
        </div>
      ))}
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 0.15, 0.3].map((d, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-surface-500 animate-bounce" style={{ animationDelay: `${d}s` }} />
      ))}
    </div>
  )
}

function SuggestionChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full border border-surface-600 bg-surface-800/80 px-3 py-1 text-[11px] text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors whitespace-nowrap">
      {text}
    </button>
  )
}

function SidebarPanel({ agent, activeAgent, setActiveAgent, systemPrompt, promptVersion, evalStats, runEval, testCaseCount, constitutionalRules, toolDefinitions }: {
  agent: typeof AGENTS[number]; activeAgent: string; setActiveAgent: (id: AgentId) => void
  systemPrompt: string; promptVersion: { variant: string; version: number }
  evalStats: { avgScore: number; passRate: number; avgLatency: number } | null
  runEval: () => void; testCaseCount: number
  constitutionalRules: { id: string; principle: string; category: string; severity: string }[]
  toolDefinitions: { name: string; description: string }[]
}) {
  const [tab, setTab] = useState<"prompt" | "eval" | "constitution" | "tools">("prompt")
  const isActive = activeAgent === agent.id
  return (
    <div>
      <button onClick={() => setActiveAgent(agent.id as AgentId)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          isActive ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20" : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
        }`}>
        <span className={`flex h-7 w-7 items-center justify-center rounded-md bg-surface-800 font-mono text-xs ${agent.color}`}>{agent.icon}</span>
        <span className="truncate">{agent.label}</span>
      </button>

      {isActive && (
        <div className="mt-2 ml-10 space-y-1">
          <div className="flex gap-1">
            {(["prompt", "eval", "constitution", "tools"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded px-2 py-0.5 text-[9px] font-medium ${tab === t ? "bg-surface-700 text-surface-200" : "text-surface-500 hover:text-surface-300"}`}>
                {t === "prompt" ? "Prompt" : t === "eval" ? "Eval" : t === "constitution" ? "AI Safety" : "Tools"}
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-surface-900/50 p-2.5 text-[10px] text-surface-500">
            {tab === "prompt" && (
              <div>
                <p className="mb-1 font-medium text-surface-400">Variant: {promptVersion.variant} (v{promptVersion.version})</p>
                <p className="leading-relaxed line-clamp-6">{systemPrompt}</p>
              </div>
            )}
            {tab === "eval" && (
              <div>
                <button onClick={runEval} className="mb-2 rounded bg-accent-600/10 px-2 py-1 text-[9px] text-accent-400 hover:bg-accent-600/20">▶ Run {testCaseCount} tests</button>
                {evalStats && (
                  <div className="space-y-1">
                    <p>Score: <span className="text-surface-300">{evalStats.avgScore}%</span></p>
                    <p>Pass: <span className="text-surface-300">{evalStats.passRate}%</span></p>
                    <p>Latency: <span className="text-surface-300">{evalStats.avgLatency}ms</span></p>
                  </div>
                )}
              </div>
            )}
            {tab === "constitution" && (
              <div className="space-y-1">
                {constitutionalRules.slice(0, 4).map((r) => (
                  <p key={r.id} className={`${r.severity === "critical" ? "text-red-400" : r.severity === "high" ? "text-amber-400" : "text-surface-400"}`}>
                    [{r.category}] {r.principle.slice(0, 50)}
                  </p>
                ))}
              </div>
            )}
            {tab === "tools" && (
              <div className="space-y-1">
                {toolDefinitions.map((t) => (
                  <p key={t.name} className="text-surface-400"><span className="text-surface-300">{t.name}</span>: {t.description}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState<AgentId>("financial")
  const [input, setInput] = useState("")
  const [showOrchestration, setShowOrchestration] = useState(true)
  const [showCritique, setShowCritique] = useState(true)
  const [showConstitution, setShowConstitution] = useState(true)
  const [slashVisible, setSlashVisible] = useState(false)
  const [slashQuery, setSlashQuery] = useState("/")
  const [slashIdx, setSlashIdx] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    messages, isLoading, sendMessage, clearHistory, suggestions, systemPrompt,
    promptVersion, evalResults, runEval, evalStats, handleFileUpload,
    testCaseCount, constitutionalRules, toolDefinitions,
  } = useChatMemory({ agentId: activeAgent })

  const { filterCommands } = useCommands({
    onClearChat: clearHistory,
  })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isLoading])

  const currentAgent = AGENTS.find((a) => a.id === activeAgent)!

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    setSlashVisible(false)
    sendMessage(text)
  }, [input, isLoading, sendMessage])

  const filteredSlash = useMemo(
    () => (slashVisible ? filterCommands(slashQuery) : []),
    [slashVisible, slashQuery, filterCommands]
  )

  const handleSlashSelect = useCallback(
    (cmd: { action: () => void }) => {
      setInput("")
      setSlashVisible(false)
      cmd.action()
    },
    []
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (slashVisible && filteredSlash.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSlashIdx((i) => Math.min(i + 1, filteredSlash.length - 1))
          return
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSlashIdx((i) => Math.max(i - 1, 0))
          return
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          const cmd = filteredSlash[slashIdx]
          if (cmd) {
            handleSlashSelect(cmd)
            return
          }
        }
        if (e.key === "Escape") {
          e.preventDefault()
          setSlashVisible(false)
          return
        }
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [slashVisible, filteredSlash, slashIdx, handleSlashSelect, handleSend]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value
      setInput(val)

      if (val.startsWith("/") && val.length >= 1) {
        setSlashVisible(true)
        setSlashQuery(val)
        setSlashIdx(0)
      } else {
        setSlashVisible(false)
      }
    },
    []
  )

  const handleFilePick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFileUpload(file)
    e.target.value = ""
  }, [handleFileUpload])

  const hasHistory = messages.length > 0

  const { data: agentsResult, isLoading: agentsLoading, isError: agentsError } = useAgentsQuery()
  const dbAgents = agentsResult?.data ?? []

  const agentStatusMap = useMemo(() => {
    const map = new Map<string, AgentStatus>()
    dbAgents.forEach((a) => map.set(a.id, a))
    return map
  }, [dbAgents])

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">
      <div className="w-56 shrink-0 space-y-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Agentes</h2>
        {AGENTS.map((agent) => {
          const dbStatus = agentStatusMap.get(agent.id)
          return (
            <div key={agent.id} className="relative">
              <SidebarPanel agent={agent} activeAgent={activeAgent} setActiveAgent={setActiveAgent}
                systemPrompt={systemPrompt} promptVersion={promptVersion}
                evalStats={evalStats} runEval={runEval} testCaseCount={testCaseCount}
                constitutionalRules={constitutionalRules} toolDefinitions={toolDefinitions} />
              {dbStatus && (
                <span className={`absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full ${
                  dbStatus.status === "online" ? "bg-success" :
                  dbStatus.status === "busy" ? "bg-warning" :
                  dbStatus.status === "error" ? "bg-danger" :
                  "bg-surface-500"
                }`} title={`${dbStatus.status} · ${dbStatus.metrics.avgLatency}ms`} />
              )}
            </div>
          )
        })}

        {agentsLoading && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-20" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        )}

        {agentsError && (
          <div className="rounded-lg bg-danger/5 border border-danger/20 p-2.5 text-[10px] text-danger">
            Error al cargar estado de agentes
          </div>
        )}

        {dbAgents.length > 0 && (
          <div className="pt-3 border-t border-surface-700/30">
            <p className="text-[10px] font-medium uppercase tracking-wider text-surface-500 mb-2">Estado DB</p>
            <div className="space-y-1.5">
              {dbAgents.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-1.5 w-1.5 rounded-full ${
                      a.status === "online" ? "bg-success" :
                      a.status === "busy" ? "bg-warning" :
                      a.status === "error" ? "bg-danger" : "bg-surface-500"
                    }`} />
                    <span className="text-surface-400">{a.name}</span>
                  </div>
                  <span className="text-surface-600">{a.metrics.avgLatency}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 space-y-3">
          <label className="flex items-center gap-2 text-[10px] text-surface-500">
            <input type="checkbox" checked={showOrchestration} onChange={() => setShowOrchestration(!showOrchestration)} />
            Show orchestration
          </label>
          <label className="flex items-center gap-2 text-[10px] text-surface-500">
            <input type="checkbox" checked={showCritique} onChange={() => setShowCritique(!showCritique)} />
            Show critique
          </label>
          <label className="flex items-center gap-2 text-[10px] text-surface-500">
            <input type="checkbox" checked={showConstitution} onChange={() => setShowConstitution(!showConstitution)} />
            Show AI safety
          </label>
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-xl border border-surface-700/50 bg-surface-800/50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-700/50 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-7 w-7 items-center justify-center rounded-md bg-surface-800 font-mono text-xs ${currentAgent.color}`}>{currentAgent.icon}</span>
            <div>
              <p className="text-sm font-medium text-surface-200">{currentAgent.label}</p>
              <p className="text-xs text-surface-500">{isLoading ? "Procesando…" : `${messages.length} mensajes`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasHistory && (
              <button onClick={clearHistory} className="rounded-md bg-surface-700/50 px-2.5 py-1 text-[10px] font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors">
                Nueva conversación
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!hasHistory && !isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-12 text-center">
              <span className={`text-3xl mb-3 ${currentAgent.color}`}>{currentAgent.icon}</span>
              <p className="text-sm font-medium text-surface-200 max-w-md">¿En qué puedo ayudarte?</p>
              <p className="mt-1 text-xs text-surface-500">Usando prompt: <span className="font-mono">{promptVersion.variant} v{promptVersion.version}</span></p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
                {suggestions.slice(0, 4).map((s) => (
                  <SuggestionChip key={s} text={s} onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }} />
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-accent-600 text-white" : "bg-surface-900 text-surface-200"}`}>
                  {msg.modelTier && msg.role === "assistant" && (
                    <div className="mb-2 flex items-center gap-2">
                      <ModelBadge tier={msg.modelTier} />
                      {msg.promptVersion && <span className="text-[9px] text-surface-500 font-mono">{msg.promptVersion}</span>}
                    </div>
                  )}

                  {/* Orchestration pipeline */}
                  {msg.orchestration && showOrchestration && (
                    <div className="mb-2 rounded-lg bg-surface-800 p-2 text-[9px] font-mono">
                      <p className="text-surface-400 mb-1">Pipeline: router → planner → {msg.orchestration.specialistCalls.length} specialists → critic → reviser</p>
                      <span className="text-surface-500">Route: {msg.orchestration.route}</span>
                    </div>
                  )}

                  {/* Tool calls */}
                  {msg.tools && <ToolCallDisplay tools={msg.tools} />}

                  {/* Main content */}
                  {msg.content && (
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.tools?.length ? "mt-2" : ""}`}>{msg.content}</p>
                  )}

                  {!msg.content && msg.tools?.length ? <div className="py-2"><LoadingDots /></div> : null}

                  {/* Self-critique */}
                  {msg.critiques && showCritique && (
                    <div className="mt-3 rounded-lg border border-amber-600/20 bg-amber-600/5 p-2">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-amber-400 mb-1">Self-Critique</p>
                      <p className="text-[10px] text-amber-300/80">{msg.critiques}</p>
                    </div>
                  )}

                  {/* Constitutional AI violations */}
                  {msg.constitutionalViolations && showConstitution && msg.constitutionalViolations.length > 0 && (
                    <div className="mt-3 rounded-lg border border-red-600/20 bg-red-600/5 p-2">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-red-400 mb-1">⚠ Constitutional AI</p>
                      {msg.constitutionalViolations.map((v, i) => (
                        <p key={i} className="text-[10px] text-red-300/80">{v}</p>
                      ))}
                    </div>
                  )}

                  {/* Multi-modal files */}
                  {msg.multiModal && msg.multiModal.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {msg.multiModal.map((m) => (
                        <div key={m.id} className="rounded bg-surface-800 px-2 py-1 text-[10px] text-surface-400">
                          [{m.modality}] {m.name} ({(m.size / 1024).toFixed(0)}KB)
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-surface-700/30 pt-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-surface-500">Fuentes</p>
                      {msg.sources.map((s, si) => (
                        <div key={si} className="group relative rounded-md bg-surface-800 px-2.5 py-1.5 cursor-pointer hover:bg-surface-700/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-surface-300">{s.title}</p>
                            <span className="text-[9px] font-mono text-surface-500">ISD</span>
                          </div>
                          <p className="text-[10px] text-surface-500">{s.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-surface-900 px-4 py-3"><LoadingDots /></div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-surface-700/50 p-4">
          <AnimatePresence>
            {!isLoading && hasHistory && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {suggestions.slice(0, 4).map((s) => (
                  <SuggestionChip key={s} text={s} onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <SlashCommands
              commands={filteredSlash}
              visible={slashVisible && filteredSlash.length > 0}
              selectedIndex={slashIdx}
              onSelect={handleSlashSelect}
              onHighlight={setSlashIdx}
              onClose={() => setSlashVisible(false)}
            />

            <div className="flex items-end gap-2">
              <button onClick={() => fileRef.current?.click()} className="shrink-0 rounded-lg bg-surface-800 px-3 py-2.5 text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-colors text-xs">
                📎
              </button>
              <input ref={fileRef} type="file" onChange={handleFilePick} className="hidden" accept="image/*,.pdf,.csv,.xlsx,.mp3,.wav" />

              <textarea ref={inputRef} value={input} onChange={handleInputChange}
                onKeyDown={handleKeyDown} placeholder={`Pregúntale al ${currentAgent.label}… (o escribe / para comandos)`} rows={1}
                className="flex-1 resize-none rounded-lg bg-surface-900 px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none ring-1 ring-surface-700 focus:ring-accent-500/50 transition-all" />
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                className="shrink-0 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-500 disabled:opacity-40 disabled:cursor-not-allowed">
                {isLoading ? "…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
