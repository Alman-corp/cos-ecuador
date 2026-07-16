"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/lib/stores/session-store"

interface Notification {
  id: string
  company_id: string
  user_id: string
  title: string
  body: string | null
  channel: string
  type: string
  reference_type: string | null
  reference_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

interface NotificationsResponse {
  data: Notification[]
  total: number
}

interface UnreadCountResponse {
  unreadCount: number
}

async function fetchNotifications(
  userId: string,
  companyId: string,
  options?: { limit?: number; offset?: number; unreadOnly?: boolean }
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({ companyId })
  if (options?.limit) params.set("limit", String(options.limit))
  if (options?.offset) params.set("offset", String(options.offset))
  if (options?.unreadOnly) params.set("unreadOnly", "true")

  const res = await fetch(`/api/notifications/${userId}?${params}`)
  if (!res.ok) throw new Error("Failed to fetch notifications")
  return res.json()
}

async function fetchUnreadCount(
  userId: string,
  companyId: string
): Promise<number> {
  const res = await fetch(`/api/notifications/${userId}/unread-count?companyId=${companyId}`)
  if (!res.ok) throw new Error("Failed to fetch unread count")
  const data: UnreadCountResponse = await res.json()
  return data.unreadCount
}

async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) throw new Error("Failed to mark as read")
}

export function useNotifications(
  companyId: string,
  options?: { limit?: number; unreadOnly?: boolean }
) {
  const { user } = useSession()

  return useQuery({
    queryKey: ["notifications", user?.id, companyId, options],
    queryFn: () =>
      fetchNotifications(user!.id, companyId, options),
    enabled: !!user?.id && !!companyId,
    staleTime: 60_000,
  })
}

export function useUnreadCount(companyId: string) {
  const { user } = useSession()

  return useQuery({
    queryKey: ["notifications-unread", user?.id, companyId],
    queryFn: () => fetchUnreadCount(user!.id, companyId),
    enabled: !!user?.id && !!companyId,
    staleTime: 60_000,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  const { user } = useSession()

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] })
    },
  })
}
