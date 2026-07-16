"use client"

import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { useUnreadCount } from "@/lib/hooks/use-notifications"
import { NotificationCenter } from "./NotificationCenter"
import { useSession } from "@/lib/stores/session-store"

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { user, company } = useSession()
  const companyId = company?.id ?? user?.id ?? ""
  const { data: unreadCount = 0 } = useUnreadCount(companyId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-gray-400 hover:bg-surface-700 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96">
          <NotificationCenter onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
