"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/lib/stores/session-store"

export interface WSNotification {
  id: string
  title: string
  body: string | null
  type: string
  is_read: boolean
  created_at: string
}

export function useNotificationsWS() {
  const { user, company } = useSession()
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState<WSNotification | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3010"

    const socket = io(`${wsUrl}/notifications`, {
      auth: { token: user.accessToken ?? "" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      setConnected(true)
    })

    socket.on("disconnect", () => {
      setConnected(false)
    })

    socket.on("initial_state", (data: { unreadCount: number; notifications: WSNotification[] }) => {
      setUnreadCount(data.unreadCount)
      queryClient.setQueryData(["notifications", user.id, company?.id], {
        data: data.notifications,
        total: data.notifications.length,
      })
    })

    socket.on("new_notification", (notification: WSNotification) => {
      setLatestNotification(notification)
      setUnreadCount((prev) => prev + 1)
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
    })

    socket.on("notification_read", ({ notificationId }: { notificationId: string }) => {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    })

    socket.on("all_read", () => {
      setUnreadCount(0)
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id, company?.id, queryClient])

  const markAsRead = useCallback((notificationId: string) => {
    socketRef.current?.emit("mark_read", { notificationId })
  }, [])

  const markAllAsRead = useCallback(() => {
    socketRef.current?.emit("mark_all_read")
  }, [])

  return {
    unreadCount,
    latestNotification,
    connected,
    markAsRead,
    markAllAsRead,
  }
}
