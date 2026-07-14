import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CompanyStep } from "../CompanyStep"

describe("CompanyStep", () => {
  const defaultProps = {
    data: {},
    setData: () => {},
    onNext: () => {},
  }

  it("el botón Continuar está deshabilitado si name está vacío", () => {
    render(<CompanyStep {...defaultProps} />)
    const button = screen.getByRole("button", { name: /continuar/i })
    expect(button).toBeDisabled()
  })

  it("el botón se habilita cuando se escribe un nombre", async () => {
    const user = userEvent.setup()
    render(<CompanyStep {...defaultProps} />)
    const input = screen.getByPlaceholderText("ACME Manufacturing S.A.")
    await user.type(input, "Test Corp")

    const button = screen.getByRole("button", { name: /continuar/i })
    expect(button).not.toBeDisabled()
  })

  it("renderiza los clientes recientes", () => {
    render(<CompanyStep {...defaultProps} />)
    expect(screen.getByText("ACME Manufacturing")).toBeInTheDocument()
    expect(screen.getByText("TechNova Solutions")).toBeInTheDocument()
    expect(screen.getByText("Grupo Bimbo SAB")).toBeInTheDocument()
  })
})
