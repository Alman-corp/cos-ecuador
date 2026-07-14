"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Slash, Loader2, AlertTriangle, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { DD_COMMANDS, parseDDCommand, filterDDCommands } from "@/lib/dd/commands"
import { useChatMemory, type ChatMessage } from "@/hooks/useChatMemory"
import { hasValidKey } from "@/lib/ai/openai-client"
import { DD_SUGGESTION_QUESTIONS } from "@/lib/prompts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DDChatPanel({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [showCommands, setShowCommands] = useState(false)
  const [filtered, setFiltered] = useState(DD_COMMANDS)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
    suggestions,
  } = useChatMemory({ agentId: "dd-analyst" })

  const apiKeyMissing = !hasValidKey()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleInputChange(val: string) {
    setInput(val)
    if (val.startsWith("/")) {
      setShowCommands(true)
      setFiltered(filterDDCommands(val))
    } else {
      setShowCommands(false)
    }
  }

  function selectCommand(cmd: (typeof DD_COMMANDS)[0]) {
    setInput(cmd.command + " ")
    setShowCommands(false)
    inputRef.current?.focus()
  }

  async function handleSend() {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput("")
    setShowCommands(false)

    const parsed = parseDDCommand(userMsg)
    if (parsed) {
      setInput("")
      // Send via useChatMemory with DD command annotation
      await sendMessage(`[DD Command: ${parsed.command.command}] ${parsed.args}`)
    } else {
      await sendMessage(userMsg)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Abrir chat de comandos"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg shadow-accent-600/25 hover:bg-accent-500 transition-colors"
      >
        <Slash className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[400px] flex-col rounded-2xl border border-surface-700 bg-surface-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
              <span className="text-sm font-medium text-surface-200">
                Analista DD
              </span>
              <div className="flex items-center gap-2">
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-400" />}
                <button onClick={clearHistory} className="text-[10px] text-surface-500 hover:text-surface-300 transition-colors">
                  Limpiar
                </button>
                <span className="text-[10px] font-mono text-surface-500">
                  {clientId.slice(0, 8)}...
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-surface-500 space-y-3 px-4">
                  {apiKeyMissing && (
                    <div className="flex items-center gap-2 rounded-lg bg-yellow-900/30 border border-yellow-700/40 px-3 py-2 text-xs text-yellow-400 w-full">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Modo simulado: configura OPENAI_API_KEY en .env.local para respuestas con IA real</span>
                    </div>
                  )}
                  <p className="text-sm">Analista de Due Diligence</p>
                  <p className="text-xs">Usa / para comandos rápidos de DD</p>
                </div>
              )}
              {messages.map((m, i) => (
                <ChatBubble key={i} message={m} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-surface-800 px-3 py-2 text-sm text-surface-400 flex items-center gap-2">
                    <span className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span>Pensando{apiKeyMissing ? " (modo simulado)" : ""}...</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {messages.length === 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {(suggestions.length > 0 ? suggestions : DD_SUGGESTION_QUESTIONS).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      disabled={isLoading}
                      className="text-[11px] px-2 py-1 rounded-full bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200 disabled:opacity-40 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative border-t border-surface-700 p-3">
              {showCommands && filtered.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-surface-700 bg-surface-800 p-2 shadow-lg max-h-48 overflow-y-auto">
                  {filtered.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => selectCommand(cmd)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-surface-300 hover:bg-surface-700 transition-colors"
                    >
                      <span className="font-mono text-accent-400">
                        {cmd.command}
                      </span>
                      <span className="text-xs text-surface-500">
                        {cmd.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) handleSend()
                    if (e.key === "Escape") setShowCommands(false)
                  }}
                  placeholder="Escribe un comando o pregunta..."
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[88%] space-y-1">
        <div
          className={`rounded-xl px-3 py-2 text-sm ${
            isUser
              ? "bg-accent-600 text-white"
              : "bg-surface-800 text-surface-300"
          }`}
        >
          {message.content}
        </div>

        {message.constitutionalViolations && message.constitutionalViolations.length > 0 && (
          <div className="flex items-start gap-1.5 px-2 py-1 rounded-lg bg-yellow-900/30 border border-yellow-700/40">
            <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-[10px] text-yellow-400">
              {message.constitutionalViolations.map((v, i) => (
                <div key={i}>{v}</div>
              ))}
            </div>
          </div>
        )}

        {message.critiques && !message.critiques.includes("No se identificaron") && (
          <div className="px-2 py-1 rounded-lg bg-blue-900/20 border border-blue-700/30">
            <div className="text-[10px] text-blue-400">
              {message.critiques.split("\n").slice(0, 2).join(" ")}
            </div>
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="text-[10px] text-surface-500 px-1 space-y-0.5">
            {message.sources.map((s, i) => (
              <div key={i}>📄 {s.title} — {s.excerpt}</div>
            ))}
          </div>
        )}

        {message.modelTier && (
          <div className="text-[9px] font-mono text-surface-600 px-1">
            {message.modelTier} · {message.promptVersion && `${message.promptVersion}`}
          </div>
        )}
      </div>
    </div>
  )
}
