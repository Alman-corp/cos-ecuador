"use client"

import { useState, type ReactNode } from "react"
import { Reorder } from "framer-motion"

export interface GridWidget {
  id: string
  content: ReactNode
  title?: string
  defaultVisible?: boolean
}

interface Props {
  widgets: GridWidget[]
  storageKey?: string
}

export function DraggableGrid({ widgets, storageKey = "dashboard-layout" }: Props) {
  const savedOrder = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as string[] } catch { return null } })()
    : null

  const [order, setOrder] = useState<string[]>(() => {
    if (savedOrder && savedOrder.length === widgets.length) return savedOrder
    return widgets.map((w) => w.id)
  })

  const [editMode, setEditMode] = useState(false)

  const orderedWidgets = order
    .map((id) => widgets.find((w) => w.id === id))
    .filter(Boolean) as GridWidget[]

  function handleReorder(newOrder: string[]) {
    setOrder(newOrder)
    try { sessionStorage.setItem(storageKey, JSON.stringify(newOrder)) } catch {}
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-medium text-surface-500">
          {editMode ? "Arrastra los widgets para reordenar" : `${widgets.length} widgets`}
        </p>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
            editMode ? "bg-accent-600/20 text-accent-400 ring-1 ring-accent-500/30" : "bg-surface-700/50 text-surface-400 hover:text-surface-200"
          }`}
        >
          {editMode ? "✓ Listo" : "✎ Editar layout"}
        </button>
      </div>

      {editMode ? (
        <Reorder.Group axis="y" values={order} onReorder={handleReorder} className="space-y-4">
          {orderedWidgets.map((w) => (
            <Reorder.Item key={w.id} value={w.id} className="cursor-grab active:cursor-grabbing">
              <div className="relative rounded-xl border border-accent-500/30 bg-surface-800/80">
                <div className="absolute -top-2.5 left-3 rounded bg-accent-600 px-2 py-0.5 text-[9px] font-mono text-white">
                  ⋮⋮ {w.title ?? w.id}
                </div>
                <div className="pt-3">{w.content}</div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="space-y-4">
          {orderedWidgets.map((w) => (
            <div key={w.id}>{w.content}</div>
          ))}
        </div>
      )}
    </div>
  )
}
