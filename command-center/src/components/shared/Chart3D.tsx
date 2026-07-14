"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import * as THREE from "three"

interface Bar3DData {
  label: string
  value: number
  color: string
}

function Bar({
  position, height, color, label,
}: {
  position: [number, number, number]
  height: number
  color: string
  label: string
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    if (meshRef.current) {
      const target = height
      meshRef.current.scale.y += (target / 2 - meshRef.current.scale.y) * delta * 3
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        scale={[1, 0.01, 1]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.6, 2, 0.6]} />
        <meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.3}
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.15}
        color="#64748b"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>
      <Text
        position={[0, height + 0.3, 0]}
        fontSize={0.12}
        color="#e2e8f0"
        anchorX="center"
        anchorY="bottom"
      >
        {`$${height.toFixed(1)}B`}
      </Text>
    </group>
  )
}

function Scene({ data }: { data: Bar3DData[] }) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08
    }
  })

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const bars = useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        position: [
          (i - (data.length - 1) / 2) * 1.2,
          (d.value / maxVal) * 2.5 / 2,
          0,
        ] as [number, number, number],
        height: (d.value / maxVal) * 2.5,
      })),
    [data, maxVal]
  )

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.2} />
      {bars.map((bar) => (
        <Bar key={bar.label} {...bar} />
      ))}
    </group>
  )
}

interface Props {
  data: Bar3DData[]
  height?: number
}

export function Chart3D({ data, height = 350 }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div style={{ height }} className="rounded-xl bg-surface-900/50 flex items-center justify-center"><p className="text-xs text-surface-500">Cargando visualización 3D…</p></div>

  return (
    <div className="rounded-xl overflow-hidden" style={{ height }}>
      <Canvas camera={{ position: [0, 3, 6], fov: 45 }} style={{ background: "transparent" }}>
        <Scene data={data} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  )
}
