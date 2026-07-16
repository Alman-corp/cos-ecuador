"use client"

import { useState } from "react"
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { useNotifications, useMarkAsRead } from "@/lib/hooks/use-notifications"
import { useSession } from "@/lib/stores/session-store"
import { useRouter } from "next/navigation"

const TYPE_LABELS: Record<string, string> = {
  obligation_due_soon: "Obligación por vencer",
  obligation_overdue: "Obligación vencida",
  declaration_reminder: "Recordatorio declaración",
  payment_confirmed: "Pago confirmado",
  payment_failed: "Pago fallido",
  sri_invoice_received: "Factura SRI recibida",
  sri_invoice_rejected: "Factura SRI rechazada",
  audit_triggered: "Auditoría activada",
  document_expiring: "Documento por expirar",
  document_expired: "Documento expirado",
  system_alert: "Alerta del sistema",
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "ahora"
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString("es-EC", { dateStyle: "short" })
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all")
  const [page, setPage] = useState(0)
  const pageSize = 20
  const { user, company } = useSession()
  const router = useRouter()
  const companyId = company?.id ?? user?.id ?? ""
  const { data, isLoading } = useNotifications(companyId, {
    unreadOnly: tab === "unread",
    limit: pageSize,
    offset: page * pageSize,
  })
  const markAsRead = useMarkAsRead()

  const notifications = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-sm text-gray-400">
            {total} notificaciones en total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "all" ? "bg-primary-600 text-white" : "bg-surface-700 text-gray-400 hover:text-white"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setTab("unread")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "unread" ? "bg-primary-600 text-white" : "bg-surface-700 text-gray-400 hover:text-white"
            }`}
          >
            No leídas
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-surface-600 bg-surface-800">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <Bell className="mb-4 h-12 w-12" />
            <p className="text-lg font-medium">No hay notificaciones</p>
            <p className="text-sm">
              {tab === "unread" ? "No tienes notificaciones sin leer" : "No hay notificaciones para mostrar"}
            </p>
          </div>
        )}

        {!isLoading && notifications.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-4 border-b border-surface-700 px-6 py-4 transition-colors ${
              item.is_read ? "" : "bg-surface-750"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm ${item.is_read ? "text-gray-300" : "font-semibold text-white"}`}>
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {TYPE_LABELS[item.type] ?? item.type} &middot; {timeAgo(item.created_at)}
                  </p>
                </div>
                {!item.is_read && (
                  <button
                    onClick={() => markAsRead.mutate(item.id)}
                    className="shrink-0 rounded-lg bg-surface-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-surface-600 hover:text-white transition-colors"
                  >
                    <CheckCheck className="mr-1 inline h-3.5 w-3.5" />
                    Leída
                  </button>
                )}
              </div>
              {item.body && (
                <p className="mt-2 text-sm text-gray-400">{item.body}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-lg bg-surface-700 px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          <span className="text-sm text-gray-400">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 rounded-lg bg-surface-700 px-3 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
