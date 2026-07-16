"use client"

import { useMutation } from "@tanstack/react-query"
import { useSession } from "@/lib/stores/session-store"

interface PublishParams {
  companyId: string
  userId: string | string[]
  channel: string
  type: string
  templateType?: string
  subject?: string
  body?: string
  variables?: Record<string, unknown>
  referenceType?: string
  referenceId?: string
}

async function publishNotification(params: PublishParams): Promise<void> {
  const res = await fetch("/api/notifications/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(err.error ?? "Failed to send notification")
  }
}

export function usePublishNotification() {
  return useMutation({
    mutationFn: publishNotification,
  })
}
