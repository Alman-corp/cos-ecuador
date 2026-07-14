"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, RoundedBox, Text, Html } from "@react-three/drei"
import type { Mesh, Group } from "three"

function KPIBox({
  position,
  label,
  value,
  color,
  delay,
}: {
  position: [number, number, number]
  label: string
  value: string
  color: string
  delay: number
}) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(clock.elapsedTime * 0.5 + delay) * 0.05
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <RoundedBox args={[1.2, 0.6, 0.08]} radius={0.04}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.15}
            roughness={0.3}
            metalness={0.1}
          />
        </RoundedBox>
        <RoundedBox
          args={[1.2, 0.6, 0.04]}
          radius={0.04}
          position={[0, 0, 0.02]}
        >
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.05}
            roughness={0.5}
          />
        </RoundedBox>
      </Float>
      <Html
        position={[0, 0, 0.06]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="flex flex-col items-center whitespace-nowrap">
          <span className="text-[8px] font-medium tracking-wider text-white/50 uppercase">
            {label}
          </span>
          <span className="text-sm font-bold text-white">{value}</span>
        </div>
      </Html>
    </group>
  )
}

function ChartBar({
  position,
  height,
  delay,
}: {
  position: [number, number, number]
  height: number
  delay: number
}) {
  const ref = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      const scale = ref.current.scale
      scale.y = 1 + Math.sin(clock.elapsedTime * 0.8 + delay) * 0.1
    }
  })

  return (
    <mesh
      ref={ref}
      position={position}
      scale={[1, 1, 1]}
    >
      <boxGeometry args={[0.08, height, 0.04]} />
      <meshStandardMaterial
        color="#3b82f6"
        transparent
        opacity={0.6}
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  )
}

function ChartGroup() {
  const bars = [
    { h: 0.4, delay: 0 },
    { h: 0.7, delay: 0.3 },
    { h: 0.5, delay: 0.6 },
    { h: 0.9, delay: 0.9 },
    { h: 0.6, delay: 1.2 },
    { h: 1.0, delay: 1.5 },
    { h: 0.75, delay: 1.8 },
  ]

  return (
    <group position={[-1.2, -0.2, 0]}>
      {bars.map((bar, i) => (
        <ChartBar
          key={i}
          position={[i * 0.14 - 0.42, bar.h / 2 - 0.5, 0]}
          height={bar.h}
          delay={bar.delay}
        />
      ))}
    </group>
  )
}

function DashboardScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 3, 4]} intensity={0.8} />
      <directionalLight position={[-2, 1, 3]} intensity={0.3} />
      <pointLight position={[0, 2, 2]} intensity={0.5} color="#3b82f6" />

      <group position={[0, 0, 0]}>
        <RoundedBox args={[3.6, 2.2, 0.06]} radius={0.06}>
          <meshStandardMaterial
            color="#1e293b"
            transparent
            opacity={0.6}
            roughness={0.4}
            metalness={0.3}
          />
        </RoundedBox>

        <RoundedBox
          args={[3.6, 2.2, 0.02]}
          radius={0.06}
          position={[0, 0, -0.02]}
        >
          <meshStandardMaterial
            color="#3b82f6"
            transparent
            opacity={0.05}
            roughness={0.5}
          />
        </RoundedBox>

        <Text
          position={[-1.2, 0.85, 0.05]}
          fontSize={0.08}
          color="#94a3b8"
          anchorX="left"
          anchorY="middle"
        >
          COS Analytics
        </Text>

        <KPIBox
          position={[0.6, 0.65, 0.05]}
          label="Revenue Growth"
          value="+24.8%"
          color="#3b82f6"
          delay={0}
        />
        <KPIBox
          position={[1.3, 0.65, 0.05]}
          label="Net Margin"
          value="18.2%"
          color="#10b981"
          delay={0.5}
        />
        <KPIBox
          position={[2.0, 0.65, 0.05]}
          label="Runway"
          value="14.2mo"
          color="#f59e0b"
          delay={1}
        />

        <ChartGroup />

        <mesh position={[-1.6, -0.7, 0.03]}>
          <planeGeometry args={[0.08, 0.08]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.8} />
        </mesh>
        <Text
          position={[-1.45, -0.7, 0.05]}
          fontSize={0.06}
          color="#64748b"
          anchorX="left"
          anchorY="middle"
        >
          Real-time sync
        </Text>
      </group>

      </>
  )
}

export function Dashboard3D() {
  return (
    <div className="h-[320px] w-full max-w-[500px] [perspective:800px]">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <DashboardScene />
      </Canvas>
    </div>
  )
}
