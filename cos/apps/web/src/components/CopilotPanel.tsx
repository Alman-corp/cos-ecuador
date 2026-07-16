"use client"

import { useState, useRef, useEffect } from "react"

interface CopilotPanelProps {
  clientId: string
  clientName: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  traceId?: string
  tools?: { name: string; description: string; params: any }[]
  feedbackGiven?: boolean
}

export default function CopilotPanel({ clientId, clientName }: CopilotPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Hola! Soy tu AI Copilot. Estoy analizando los datos de **${clientName}**. Preguntame sobre salud financiera, documentos, o genera acciones.` },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendFeedback = async (traceId: string, score: number) => {
    try {
      await fetch("/api/ai/copilot/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traceId, score }),
      })
      setMessages((prev) => prev.map((m) =>
        m.traceId === traceId ? { ...m, feedbackGiven: true } : m
      ))
    } catch {}
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message: userMsg, conversationId }),
      })
      const data = await res.json()
      if (res.ok) {
        setConversationId(data.conversationId)
        setMessages((prev) => [...prev, { role: "assistant", content: data.message, traceId: data.traceId, tools: data.suggestedTools }])
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error || "No pude procesar tu mensaje"}` }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexion. Intenta de nuevo." }])
    } finally { setLoading(false) }
  }

  const executeTool = async (tool: { name: string; description: string; params: any }) => {
    setMessages((prev) => [...prev, { role: "assistant", content: `Ejecutando: **${tool.description}**...` }])
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName: tool.name, params: { ...tool.params, clientId } }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.message || "Accion completada", tools: [] }])
      window.location.reload()
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error ejecutando la accion" }])
    }
  }

  const suggestedQueries = [
    "Como esta la salud del cliente?",
    "Que recomendaciones tienes?",
    "Que documentos hay disponibles?",
    "Genera un informe",
  ]

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg shadow-accent-600/30 transition-all hover:bg-accent-500 hover:shadow-accent-600/50">
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[420px] flex-col rounded-2xl border border-surface-700/50 bg-surface-900 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 border-b border-surface-700/50 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600/20 text-accent-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-surface-50">AI Copilot</p>
              <p className="text-xs text-surface-400">Asistente inteligente</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 p-5">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                    m.role === "user" ? "bg-accent-600 text-white" : "bg-surface-800 text-surface-200"
                  }`}>
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0" dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, "<br/>") }} />
                  </div>
                </div>
                {m.traceId && m.role === "assistant" && !m.feedbackGiven && (
                  <div className="mt-1 flex justify-end gap-1">
                    <button onClick={() => sendFeedback(m.traceId!, 3)}
                      className="rounded p-1 text-surface-500 hover:text-emerald-400 transition-colors" title="Util util">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" /></svg>
                    </button>
                    <button onClick={() => sendFeedback(m.traceId!, 1)}
                      className="rounded p-1 text-surface-500 hover:text-rose-400 transition-colors" title="Poco util">
                      <svg className="h-3.5 w-3.5 scale-y-[-1]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" /></svg>
                    </button>
                  </div>
                )}
                {m.traceId && m.feedbackGiven && (
                  <div className="mt-1 flex justify-end">
                    <span className="text-[10px] text-surface-500">Feedback enviado</span>
                  </div>
                )}
                {m.tools && m.tools.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.tools.map((t, j) => (
                      <button key={j} onClick={() => executeTool(t)}
                        className="rounded-lg border border-accent-600/30 bg-accent-600/10 px-3 py-1.5 text-xs font-medium text-accent-400 hover:bg-accent-600/20 transition-colors">
                        {t.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-surface-800 px-4 py-2.5 text-sm text-surface-400">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-400" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && !loading && (
            <div className="border-t border-surface-700/50 px-5 py-3">
              <p className="mb-2 text-xs text-surface-500">Sugerencias:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((q) => (
                  <button key={q} onClick={() => { setInput(q); setTimeout(sendMessage, 100) }}
                    className="rounded-full border border-surface-700 bg-surface-800/50 px-3 py-1 text-xs text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-surface-700/50 p-4">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Pregunta sobre el cliente..."
                className="flex-1 rounded-xl border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-50 placeholder-surface-500 outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600/30"
                disabled={loading} />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-600 text-white hover:bg-accent-500 disabled:opacity-50 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
