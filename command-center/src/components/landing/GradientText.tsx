import type { ReactNode } from "react"

export function GradientText({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`bg-gradient-to-r from-accent-400 via-purple-400 to-accent-300 bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  )
}
