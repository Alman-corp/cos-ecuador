import { describe, it, expect } from "vitest"
import { parseDDCommand, filterDDCommands } from "../dd/commands"

describe("parseDDCommand", () => {
  it("reconoce /scenario revenue -10%", () => {
    const result = parseDDCommand("/scenario revenue -10%")
    expect(result).not.toBeNull()
    expect(result!.command.id).toBe("scenario")
    expect(result!.args).toBe("revenue -10%")
  })

  it("reconoce /risk concentration", () => {
    const result = parseDDCommand("/risk concentration")
    expect(result).not.toBeNull()
    expect(result!.command.id).toBe("risk")
    expect(result!.args).toBe("concentration")
  })

  it("reconoce /forecast revenue 12", () => {
    const result = parseDDCommand("/forecast revenue 12")
    expect(result).not.toBeNull()
    expect(result!.command.id).toBe("forecast")
    expect(result!.args).toBe("revenue 12")
  })

  it("reconoce /export pdf completo", () => {
    const result = parseDDCommand("/export pdf completo")
    expect(result).not.toBeNull()
    expect(result!.command.id).toBe("export")
    expect(result!.args).toBe("pdf completo")
  })

  it("retorna null para comando inválido", () => {
    expect(parseDDCommand("/invalid")).toBeNull()
    expect(parseDDCommand("not a command")).toBeNull()
    expect(parseDDCommand("")).toBeNull()
  })
})

describe("filterDDCommands", () => {
  it("filtra por prefijo /scen", () => {
    const results = filterDDCommands("/scen")
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe("scenario")
  })

  it("filtra por categoría risk", () => {
    const results = filterDDCommands("risk")
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.every((c) => c.category === "risk")).toBe(true)
  })

  it("retorna array vacío para prefijo sin match", () => {
    expect(filterDDCommands("zzzz")).toEqual([])
  })
})
