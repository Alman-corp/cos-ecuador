"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Line } from "@react-three/drei"
import * as THREE from "three"
import type { KGEntity, KGRelation } from "@/lib/knowledge-graph"

const TYPE_COLORS: Record<string, string> = {
  company: "#3b82f6",
  metric: "#10b981",
  person: "#f59e0b",
  concept: "#8b5cf6",
  product: "#ec4899",
  event: "#ef4444",
  document: "#14b8a6",
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral: "#64748b",
}

function EntityNode({ entity, position, onHover, isSelected }: {
  entity: KGEntity
  position: [number, number, number]
  onHover: (e: KGEntity | null) => void
  isSelected: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    if (meshRef.current) {
      const target = isSelected ? 1.3 : hovered ? 1.15 : 1
      meshRef.current.scale.x += (target - meshRef.current.scale.x) * delta * 4
      meshRef.current.scale.z += (target - meshRef.current.scale.z) * delta * 4
      meshRef.current.scale.y += (target - meshRef.current.scale.y) * delta * 4
    }
  })

  const radius = entity.type === "company" ? 0.45 : entity.type === "metric" ? 0.35 : 0.3
  const color = TYPE_COLORS[entity.type] ?? "#64748b"

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => { setHovered(true); onHover(entity) }}
        onPointerOut={() => { setHovered(false); onHover(null) }}
      >
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          metalness={0.2}
          roughness={0.3}
          emissive={isSelected ? color : "#000000"}
          emissiveIntensity={isSelected ? 0.4 : 0}
          transparent
          opacity={hovered ? 1 : 0.85}
        />
      </mesh>
      <Text
        position={[0, -radius - 0.2, 0]}
        fontSize={0.12}
        color="#e2e8f0"
        anchorX="center"
        anchorY="top"
        maxWidth={1.5}
      >
        {entity.name}
      </Text>
      {entity.value !== undefined && (
        <Text position={[0, radius + 0.15, 0]} fontSize={0.08} color={SENTIMENT_COLORS[entity.sentiment ?? "neutral"]} anchorX="center" anchorY="bottom">
          {entity.sentiment === "positive" ? "↑" : entity.sentiment === "negative" ? "↓" : "→"} {entity.value}{entity.properties.unit ?? ""}
        </Text>
      )}
    </group>
  )
}

const TYPES = ["company", "metric", "person", "concept", "product", "event", "document"] as const

export function Graph3DScene({ entities, relations, selected, onSelect }: {
  entities: KGEntity[]
  relations: KGRelation[]
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const [hoveredEntity, setHoveredEntity] = useState<KGEntity | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)

  const filtered = filterType ? entities.filter((e) => e.type === filterType) : entities
  const filteredIds = new Set(filtered.map((e) => e.id))
  const filteredRels = relations.filter((r) => filteredIds.has(r.source) && filteredIds.has(r.target))

  const layout = useMemo(() => {
    const count = filtered.length
    const positions = new Map<string, [number, number, number]>()
    filtered.forEach((e, i) => {
      const theta = (i / count) * Math.PI * 2
      const phi = Math.cos(i * 1.5) * 0.5
      const radius = 4 + (e.type === "company" ? 0.5 : e.type === "metric" ? 0 : -0.5)
      positions.set(e.id, [
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.cos(theta) * Math.cos(phi),
      ])
    })
    return positions
  }, [filtered])

  useFrame((_, delta) => {
    if (groupRef.current && !selected) {
      groupRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }} style={{ background: "#0a0a0f" }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 5]} intensity={0.6} />
        <directionalLight position={[-3, 5, -3]} intensity={0.2} />
        <pointLight position={[0, 5, 0]} intensity={0.15} />
        <group ref={groupRef}>
          {filteredRels.map((r) => {
            const src = layout.get(r.source)
            const tgt = layout.get(r.target)
            if (!src || !tgt) return null
            if (selected && r.source !== selected && r.target !== selected) return null
            const mid: [number, number, number] = [
              (src[0] + tgt[0]) / 2,
              (src[1] + tgt[1]) / 2,
              (src[2] + tgt[2]) / 2,
            ]
            const lineColor = r.weight > 0.7 ? "#3b82f6" : r.weight > 0.4 ? "#64748b" : "#334155"
            return (
              <group key={r.id}>
                <Line points={[src, tgt]} color={lineColor} opacity={Math.abs(r.weight) * 0.6} transparent lineWidth={1} />
                <Text position={mid} fontSize={0.06} color="#94a3b8" anchorX="center" anchorY="middle">
                  {r.relation}
                </Text>
              </group>
            )
          })}
          {filtered.map((e) => (
            <EntityNode
              key={e.id}
              entity={e}
              position={layout.get(e.id) ?? [0, 0, 0]}
              onHover={setHoveredEntity}
              isSelected={selected === e.id}
            />
          ))}
        </group>
        <OrbitControls enableZoom enablePan={false} autoRotate={!selected} autoRotateSpeed={0.5} />
      </Canvas>

      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <button onClick={() => setFilterType(null)}
          className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${!filterType ? "bg-accent-600/20 text-accent-400 ring-1 ring-accent-500/30" : "bg-surface-800/60 text-surface-400 hover:bg-surface-700/60"}`}>
          All
        </button>
        {TYPES.map((t) => (
          <button key={t} onClick={() => setFilterType(filterType === t ? null : t)}
            className={`rounded px-2 py-0.5 text-[9px] font-medium capitalize transition-colors ${filterType === t ? "bg-accent-600/20 text-accent-400 ring-1 ring-accent-500/30" : "bg-surface-800/60 text-surface-400 hover:bg-surface-700/60"}`}>
            {t}
          </button>
        ))}
      </div>

      {hoveredEntity && (
        <div className="absolute bottom-3 left-3 rounded-lg border border-surface-700/50 bg-surface-900/90 px-3 py-2 backdrop-blur-sm">
          <p className="text-xs font-medium text-surface-200">{hoveredEntity.name}</p>
          <p className="text-[9px] text-surface-400 capitalize">{hoveredEntity.type}</p>
          {hoveredEntity.value !== undefined && (
            <p className="text-[9px] text-surface-500">Value: {hoveredEntity.value}{hoveredEntity.properties.unit ?? ""}</p>
          )}
          {Object.entries(hoveredEntity.properties).slice(0, 2).map(([k, v]) => (
            <p key={k} className="text-[8px] text-surface-500">{k}: {v}</p>
          ))}
        </div>
      )}

      <div className="absolute bottom-3 right-3 rounded-lg bg-surface-900/80 px-2.5 py-1.5 backdrop-blur-sm">
        <p className="text-[9px] text-surface-500">{filtered.length} entities · {filteredRels.length} relations</p>
      </div>
    </div>
  )
}
