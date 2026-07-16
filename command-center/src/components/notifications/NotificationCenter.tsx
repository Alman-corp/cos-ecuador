"use client"

import { useState } from "react"
import { X, CheckCheck, Bell, AlertTriangle, FileText, CreditCard, Info } from "lucide-react"
import { useNotifications, useMarkAsRead } from "@/lib/hooks/use-notifications"
import { useSession } from "@/lib/stores/session-store"

interface NotificationItem {
  id: string
  title: string
  body: string | null
  type: string
  is_read: boolean
  created_at: string
  reference_type: string | null
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  obligation_due_soon: AlertTriangle,
  obligation_overdue: AlertTriangle,
  declaration_reminder: Bell,
  payment_confirmed: CreditCard,
  payment_failed: CreditCard,
  sri_invoice_received: FileText,
  sri_invoice_rejected: FileText,
  audit_triggered: AlertTriangle,
  document_expiring: FileText,
  system_alert: AlertTriangle,
}

const TYPE_COLORS: Record<string, string> = {
  obligation_due_soon: "text-yellow-400",
  obligation_overdue: "text-red-400",
  payment_confirmed: "text-green-400",
  payment_failed: "text-red-400",
  sri_invoice_received: "text-blue-400",
  sri_invoice_rejected: "text-orange-400",
  audit_triggered: "text-purple-400",
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

function NotificationCard({ item, onMarkRead }: { item: NotificationItem; onMarkRead: (id: string) => void }) {
  const Icon = TYPE_ICONS[item.type] ?? Bell
  const colorClass = TYPE_COLORS[item.type] ?? "text-gray-400"

  return (
    <div
      className={`flex gap-3 border-b border-surface-700 px-4 py-3 transition-colors ${
        item.is_read ? "opacity-70" : "bg-surface-750"
      }`}
    >
      <div className={`mt-0.5 ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${item.is_read ? "text-gray-300" : "font-medium text-white"}`}>
            {item.title}
          </p>
          <span className="shrink-0 text-xs text-gray-500">{timeAgo(item.created_at)}</span>
        </div>
        {item.body && (
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">{item.body}</p>
        )}
      </div>
      {!item.is_read && (
        <button
          onClick={() => onMarkRead(item.id)}
          className="shrink-0 self-start rounded p-1 text-gray-500 hover:bg-surface-600 hover:text-white transition-colors"
          title="Marcar como leída"
        >
          <CheckCheck className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function NotificationCenter({ onClose }: { onClose?: () => void }) {
  const [tab, setTab] = useState<"all" | "unread">("all")
  const { user, company } = useSession()
  const companyId = company?.id ?? user?.id ?? ""
  const { data, isLoading } = useNotifications(companyId, {
    unreadOnly: tab === "unread",
    limit: 20,
  })
  const markAsRead = useMarkAsRead()

  const notifications = data?.data ?? []

  return (
    <div className="w-96 rounded-xl border border-surface-600 bg-surface-800 shadow-2xl">
      <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("all")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              tab === "all" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setTab("unread")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              tab === "unread" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            No leídas
          </button>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center py-8 text-gray-500">
            <Bell className="mb-2 h-8 w-8" />
            <p className="text-sm">{tab === "unread" ? "No tienes notificaciones sin leer" : "No hay notificaciones"}</p>
          </div>
        )}

        {!isLoading && notifications.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            onMarkRead={(id) => markAsRead.mutate(id)}
          />
        ))}
      </div>

      {!isLoading && notifications.length > 0 && (
        <div className="border-t border-surface-700 px-4 py-2 text-center">
          <a
            href="/notifications"
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            Ver todas las notificaciones
          </a>
        </div>
      )}
    </div>
  )
}
