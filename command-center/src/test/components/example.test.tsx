import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { KPICard } from "@/components/shared/KPICard"

describe("KPICard", () => {
  it("renders label and value", () => {
    render(<KPICard label="Revenue" value="$94.8B" />)
    expect(screen.getByText("Revenue")).toBeInTheDocument()
    expect(screen.getByText("$94.8B")).toBeInTheDocument()
  })

  it("renders change indicator when provided", () => {
    render(<KPICard label="EBITDA" value="$14.6B" change="-2.9%" trend="down" />)
    expect(screen.getByText("-2.9%")).toBeInTheDocument()
  })

  it("shows alert message for critical level", () => {
    render(
      <KPICard
        label="Net Income"
        value="$3.8B"
        change="-46.5%"
        trend="down"
        alertLevel="critical"
        alertMessage="Caída severa en utilidad neta"
      />
    )
    expect(screen.getByText("Caída severa en utilidad neta")).toBeInTheDocument()
  })
})
