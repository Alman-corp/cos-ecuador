"use client"

import dynamic from "next/dynamic"
import { useKnowledgeGraph } from "@/hooks/useKnowledgeGraph"

const Graph3DScene = dynamic(() => import("@/components/knowledge-graph/Graph3DScene").then((m) => ({ default: m.Graph3DScene })), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-xs text-surface-500">Cargando grafo 3D…</div>,
})

const TYPE_COLORS: Record<string, string> = {
  company: "bg-blue-500/10 text-blue-400",
  metric: "bg-emerald-500/10 text-emerald-400",
  person: "bg-amber-500/10 text-amber-400",
  concept: "bg-purple-500/10 text-purple-400",
  product: "bg-pink-500/10 text-pink-400",
  event: "bg-red-500/10 text-red-400",
  document: "bg-cyan-500/10 text-cyan-400",
}

export default function KnowledgeGraphPage() {
  const { graph, selectedEntity, connections, selectedId, searchQuery, selectEntity, search, clearSelection } = useKnowledgeGraph()

  const entityCountByType = graph.entities.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4 p-4">
      <div className="flex w-72 flex-col gap-3">
        <div>
          <h1 className="text-lg font-bold text-surface-50">Knowledge Graph</h1>
          <p className="text-xs text-surface-400">Grafo de conocimiento 3D</p>
        </div>

        <input value={searchQuery} onChange={(e) => search(e.target.value)}
          placeholder="Buscar entidad…"
          className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-xs text-surface-200 placeholder-surface-500 outline-none focus:ring-1 focus:ring-accent-500/50" />

        <div className="flex flex-wrap gap-1">
          {Object.entries(entityCountByType).map(([type, count]) => (
            <span key={type} className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${TYPE_COLORS[type] ?? "bg-surface-800 text-surface-400"}`}>
              {type} {count}
            </span>
          ))}
        </div>

        {selectedEntity ? (
          <div className="rounded-xl border border-accent-600/30 bg-accent-600/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-surface-200">{selectedEntity.name}</p>
              <button onClick={clearSelection} className="text-[9px] text-surface-500 hover:text-surface-300">✕</button>
            </div>
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${TYPE_COLORS[selectedEntity.type] ?? "bg-surface-800 text-surface-400"}`}>
              {selectedEntity.type}
            </span>
            {selectedEntity.value !== undefined && (
              <p className="mt-2 text-xs text-surface-400">
                Value: {selectedEntity.value}{selectedEntity.properties.unit ?? ""}
                {selectedEntity.change !== undefined && (
                  <span className={selectedEntity.change >= 0 ? "text-emerald-400 ml-1" : "text-red-400 ml-1"}>
                    ({selectedEntity.change >= 0 ? "+" : ""}{selectedEntity.change}%)
                  </span>
                )}
              </p>
            )}
            {Object.entries(selectedEntity.properties).map(([k, v]) => (
              <p key={k} className="text-[10px] text-surface-500 mt-0.5">{k}: {v}</p>
            ))}
            {connections && (
              <div className="mt-3 border-t border-surface-700/50 pt-2">
                <p className="text-[10px] font-medium text-surface-500 mb-1">Conexiones ({connections.relations.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {connections.relations.map((r) => (
                    <div key={r.id} className="flex items-center gap-1 text-[9px] text-surface-500">
                      <span className="w-16 truncate">{r.source === selectedId ? "" : r.target === selectedId ? "" : ""}</span>
                      <span className="text-surface-600">{r.relation}</span>
                      <span className="text-surface-600">· w={r.weight.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-surface-700/50 bg-surface-900/50 p-3">
            <p className="text-[10px] text-surface-500">Selecciona una entidad en el grafo 3D para ver detalles</p>
          </div>
        )}

        <div className="mt-auto rounded-xl border border-surface-700/50 bg-surface-900/50 p-3">
          <p className="text-[10px] text-surface-500">Navegación</p>
          <ul className="mt-1 space-y-0.5 text-[9px] text-surface-600">
            <li>Arrastrar: rotar cámara</li>
            <li>Scroll: zoom</li>
            <li>Click: seleccionar entidad</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-surface-700/50 bg-surface-950">
        <Graph3DScene
          entities={graph.entities}
          relations={graph.relations}
          selected={selectedId}
          onSelect={selectEntity}
        />
      </div>
    </div>
  )
}
