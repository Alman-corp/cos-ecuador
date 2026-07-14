import * as React from "react"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: number[]; onValueChange: (value: number[]) => void; min?: number; max?: number; step?: number }
>(({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const percentage = ((value[0] - min) / (max - min)) * 100

  return (
    <div
      ref={ref}
      className={cn("relative w-full h-2 bg-gray-200 rounded-full cursor-pointer", className)}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const newValue = min + x * (max - min)
        const stepped = Math.round(newValue / step) * step
        onValueChange([Math.min(max, Math.max(min, stepped))])
      }}
      {...props}
    >
      <div
        className="absolute h-full bg-blue-600 rounded-full"
        style={{ width: `${percentage}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow"
        style={{ left: `${percentage}%`, transform: `translate(-50%, -50%)` }}
      />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }
