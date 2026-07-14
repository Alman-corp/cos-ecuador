import { describe, it, expect } from "vitest"
import {
  validateCedula,
  validateRuc,
  validatePhone,
  formatCurrency,
  formatDate,
} from "@/lib/validators/ec"

describe("validateCedula", () => {
  it("returns true for a valid cedula", () => {
    expect(validateCedula("1710034065")).toBe(true)
  })

  it("returns false for an invalid cedula with wrong verifier digit", () => {
    expect(validateCedula("1710034066")).toBe(false)
  })

  it("returns false for a cedula with invalid province (00)", () => {
    expect(validateCedula("0010034065")).toBe(false)
  })

  it("returns false for a cedula with invalid province (25)", () => {
    expect(validateCedula("2510034065")).toBe(false)
  })

  it("returns false for non-numeric input", () => {
    expect(validateCedula("171003406a")).toBe(false)
  })

  it("returns false for wrong length", () => {
    expect(validateCedula("171003406")).toBe(false)
  })
})

describe("validateRuc", () => {
  it("returns true for a valid RUC (natural person)", () => {
    expect(validateRuc("1710034065001")).toBe(true)
  })

  it("returns false for a RUC with invalid province (25)", () => {
    expect(validateRuc("2510034065001")).toBe(false)
  })

  it("returns false for a RUC without 001 suffix", () => {
    expect(validateRuc("1710034065002")).toBe(false)
  })

  it("returns false for a RUC with third digit >= 6", () => {
    expect(validateRuc("1760034065001")).toBe(false)
  })
})

describe("validatePhone", () => {
  it("returns true for a valid mobile number", () => {
    expect(validatePhone("+593912345678")).toBe(true)
  })

  it("returns true for a valid landline number", () => {
    expect(validatePhone("+59321234567")).toBe(true)
  })

  it("returns false for a number without country code", () => {
    expect(validatePhone("0991234567")).toBe(false)
  })

  it("returns false for a number with wrong country code", () => {
    expect(validatePhone("+5939123456")).toBe(false)
  })
})

describe("formatCurrency", () => {
  it("formats integer value", () => {
    expect(formatCurrency(1000)).toBe("1.000,00")
  })

  it("formats value with decimals", () => {
    expect(formatCurrency(1234.56)).toBe("1.234,56")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("0,00")
  })

  it("formats negative value", () => {
    expect(formatCurrency(-500.5)).toBe("-500,50")
  })

  it("formats large value", () => {
    expect(formatCurrency(1234567.89)).toBe("1.234.567,89")
  })
})

describe("formatDate", () => {
  it("formats a date as DD/MM/YYYY", () => {
    const date = new Date(2024, 0, 15)
    expect(formatDate(date)).toBe("15/01/2024")
  })

  it("formats December date", () => {
    const date = new Date(2024, 11, 25)
    expect(formatDate(date)).toBe("25/12/2024")
  })

  it("pads single-digit day and month", () => {
    const date = new Date(2024, 2, 5)
    expect(formatDate(date)).toBe("05/03/2024")
  })
})
