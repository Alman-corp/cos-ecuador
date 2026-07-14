"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  type: "insight" | "alert" | "success" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "alert",
    title: "OPEX en aumento",
    message: "Los gastos operativos crecieron 22.8% vs 2024 — revisar partidas",
    timestamp: new Date(),
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "FCF se recupera",
    message: "Free Cash Flow aumentó 73.7% vs 2024 a $6.2B",
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: "3",
    type: "insight",
    title: "Margen Neto comprimido",
    message: "Margen neto cayó de 7.3% a 4.0% — monitorear tendencia",
    timestamp: new Date(Date.now() - 7200000),
    read: true,
  },
  {
    id: "4",
    type: "info",
    title: "Datos actualizados",
    message: "Cifras FY 2025 cargadas correctamente desde Tesla CSV",
    timestamp: new Date(Date.now() - 86400000),
    read: true,
  },
]

function notificationIcon(type: string) {
  switch (type) {
    case "alert": return "🔴"
    case "success": return "🟢"
    case "insight": return "💡"
    default: return "ℹ️"
  }
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)

  const unread = notifications.filter((n) => !n.read).length

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg bg-surface-800 p-2 text-surface-400 hover:text-surface-200 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-surface-700 bg-surface-800 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-surface-700/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-surface-200">Notificaciones</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[10px] font-medium text-accent-400 hover:text-accent-300 transition-colors">
                  Marcar todas leídas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-xs text-surface-500">Sin notificaciones</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 border-b border-surface-700/30 px-4 py-3 transition-colors hover:bg-surface-700/30 ${n.read ? "opacity-60" : ""}`}
                  >
                    <span className="text-sm mt-0.5">{notificationIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-200">{n.title}</p>
                      <p className="text-[10px] text-surface-400 mt-0.5">{n.message}</p>
                      <p className="text-[9px] text-surface-500 mt-1">
                        {Math.round((Date.now() - n.timestamp.getTime()) / 3600000)}h atrás
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
