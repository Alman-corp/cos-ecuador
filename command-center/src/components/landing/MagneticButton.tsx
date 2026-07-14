"use client"

import { useRef, type ReactNode, type MouseEvent } from "react"

export function MagneticButton({
  children,
  className = "",
  href,
}: {
  children: ReactNode
  className?: string
  href?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)

  function handleMouse(e: MouseEvent<HTMLAnchorElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`
  }

  function handleLeave() {
    if (!ref.current) return
    ref.current.style.transform = "translate(0px, 0px)"
  }

  return (
    <a
      ref={ref}
      href={href}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={`inline-block transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </a>
  )
}
