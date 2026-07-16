"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Webhook, Plus, Trash2, TestTube, Copy, CheckCircle, X, Wifi, WifiOff } from "lucide-react"
import { useSession } from "@/lib/stores/session-store"

interface WebhookItem {
  id: string
  url: string
  event_types: string[]
  is_active: boolean
  last_triggered_at: string | null
  last_status: number | null
  description: string | null
  created_at: string
}

export default function WebhooksPage() {
  const queryClient = useQueryClient()
  const { company } = useSession()
  const companyId = company?.id ?? ""
  const [showCreate, setShowCreate] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: webhooks } = useQuery({
    queryKey: ["webhooks", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/webhooks?companyId=${companyId}`)
      if (!res.ok) throw new Error("Failed to fetch webhooks")
      return res.json()
    },
    enabled: !!companyId,
  })

  const { data: eventsData } = useQuery({
    queryKey: ["webhook-events"],
    queryFn: async () => {
      const res = await fetch("/api/webhooks/events")
      return res.json()
    },
  })

  const createWebhook = useMutation({
    mutationFn: async (data: { url: string; eventTypes: string[] }) => {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-company-id": companyId },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: (data) => {
      setNewSecret(data.signingSecret)
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
    },
  })

  const testWebhook = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/webhooks/${id}/test?companyId=${companyId}`, { method: "POST" })
      return res.json()
    },
  })

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/webhooks/${id}?companyId=${companyId}`, { method: "DELETE" })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks"] }),
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Webhook className="h-6 w-6" /> Webhooks
          </h1>
          <p className="text-sm text-gray-400">Integra COS con tus sistemas externos</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo webhook
        </button>
      </div>

      {newSecret && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
            <div className="flex-1">
              <p className="font-medium text-green-300">⚠️ Guarda este secret ahora</p>
              <p className="text-sm text-green-400/80">No podrás verlo de nuevo.</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded bg-black/30 px-3 py-2 font-mono text-sm text-green-200">
                  {newSecret}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newSecret)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="rounded-lg bg-surface-700 p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button onClick={() => setNewSecret(null)} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(!webhooks || webhooks.length === 0) && (
          <div className="flex flex-col items-center rounded-xl border border-surface-600 bg-surface-800 py-16 text-gray-500">
            <Webhook className="mb-3 h-12 w-12" />
            <p>No tienes webhooks configurados</p>
            <p className="text-sm">Crea uno para empezar a recibir eventos</p>
          </div>
        )}

        {(webhooks ?? []).map((wh: WebhookItem) => (
          <div key={wh.id} className="rounded-xl border border-surface-600 bg-surface-800 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <code className="truncate rounded bg-surface-700 px-2 py-1 font-mono text-sm text-gray-200">
                    {wh.url}
                  </code>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    wh.is_active ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"
                  }`}>
                    {wh.is_active ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {wh.is_active ? "Activo" : "Inactivo"}
                  </span>
                  {wh.last_status && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      wh.last_status < 300 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      HTTP {wh.last_status}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(wh.event_types ?? []).map((et: string) => (
                    <span key={et} className="rounded-md bg-surface-700 px-2 py-0.5 text-xs text-gray-400">
                      {et}
                    </span>
                  ))}
                </div>
                {wh.last_triggered_at && (
                  <p className="mt-2 text-xs text-gray-500">
                    Último trigger: {new Date(wh.last_triggered_at).toLocaleString("es-EC")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => testWebhook.mutate(wh.id)}
                  className="rounded-lg bg-surface-700 p-2 text-gray-400 hover:bg-surface-600 hover:text-white transition-colors"
                  title="Probar webhook"
                >
                  <TestTube className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar webhook?")) deleteWebhook.mutate(wh.id)
                  }}
                  className="rounded-lg bg-surface-700 p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  title="Eliminar webhook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <WebhookCreator
          availableEvents={eventsData?.events ?? []}
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => {
            createWebhook.mutate(data)
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}

function WebhookCreator({
  availableEvents,
  onClose,
  onSubmit,
}: {
  availableEvents: { name: string; description: string }[]
  onClose: () => void
  onSubmit: (data: { url: string; eventTypes: string[] }) => void
}) {
  const [url, setUrl] = useState("")
  const [selected, setSelected] = useState<string[]>([])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-surface-600 bg-surface-800 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Crear Webhook</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">URL del endpoint</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tu-sistema.com/webhooks/cos"
              className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Eventos a escuchar</label>
            <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto">
              {availableEvents.map((ev) => (
                <label
                  key={ev.name}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition-colors ${
                    selected.includes(ev.name)
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-surface-600 hover:border-surface-500"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(ev.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected((prev) => [...prev, ev.name])
                      } else {
                        setSelected((prev) => prev.filter((p) => p !== ev.name))
                      }
                    }}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-200">{ev.name}</div>
                    <div className="text-xs text-gray-500">{ev.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-surface-600 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSubmit({ url, eventTypes: selected })}
              disabled={!url || selected.length === 0}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50 transition-colors"
            >
              Crear webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
