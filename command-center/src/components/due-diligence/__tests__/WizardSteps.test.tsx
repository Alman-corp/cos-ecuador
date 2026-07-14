import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { WizardSteps, type Step } from "../WizardSteps"

const steps: Step[] = [
  { id: "company", label: "Empresa", icon: <span>🏢</span> },
  { id: "upload", label: "Carga", icon: <span>📄</span> },
  { id: "validate", label: "Validación", icon: <span>✅</span> },
  { id: "config", label: "Config", icon: <span>⚙️</span> },
]

describe("WizardSteps", () => {
  it("renderiza todos los steps", () => {
    render(<WizardSteps steps={steps} current={0} />)
    steps.forEach((s) => {
      expect(screen.getByText(s.label)).toBeInTheDocument()
    })
  })

  it("marca el step actual como activo", () => {
    render(<WizardSteps steps={steps} current={2} />)
    const currentStep = screen.getByText(steps[2].label)
    expect(currentStep).toBeInTheDocument()

    const stepNumbers = screen.getAllByText(/Paso \d/)
    expect(stepNumbers[2]).toHaveTextContent("Paso 3")
  })

  it("marca steps previos como completados (con check icon)", () => {
    render(<WizardSteps steps={steps} current={2} />)

    const checkIcons = document.querySelectorAll("svg")
    expect(checkIcons.length).toBeGreaterThanOrEqual(2)
  })
})
