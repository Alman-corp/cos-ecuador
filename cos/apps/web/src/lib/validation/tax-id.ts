export const taxIdPatterns: Record<string, RegExp> = {
  EC: /^\d{13}$/,
  CO: /^\d{9,11}$/,
  MX: /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/,
  PE: /^\d{11}$/,
  CL: /^\d{1,8}-[\dkK]$/,
  AR: /^\d{11}$/,
  ES: /^[A-Z]\d{8}$|^\d{8}[A-Z]$/,
  US: /^\d{2}-\d{7}$|^\d{3}-\d{2}-\d{4}$/,
}

const COUNTRY_LABELS: Record<string, string> = {
  EC: "Ecuador", CO: "Colombia", MX: "México", PE: "Perú",
  CL: "Chile", AR: "Argentina", ES: "España", US: "Estados Unidos",
}

export interface TaxIdValidation {
  valid: boolean
  formatted?: string
  error?: string
  countryName: string
}

export function validateTaxId(country: string, taxId: string): TaxIdValidation {
  const countryCode = country.toUpperCase()
  const pattern = taxIdPatterns[countryCode]
  const countryName = COUNTRY_LABELS[countryCode] || countryCode

  if (!pattern) {
    return { valid: false, countryName, error: `País no soportado: ${countryName}` }
  }

  const cleaned = taxId.replace(/\s/g, "")
  if (!pattern.test(cleaned)) {
    const labels: Record<string, string> = {
      EC: "13 dígitos numéricos",
      CO: "9 a 11 dígitos",
      MX: "RFC válido (ej: ABCD123456XYZ)",
      PE: "11 dígitos",
      CL: "RUT válido (ej: 12345678-9)",
      AR: "11 dígitos (CUIT)",
      ES: "NIF/NIE español",
      US: "EIN o SSN válido",
    }
    return { valid: false, countryName, error: `Formato inválido para ${countryName}. Debe ser: ${labels[countryCode] || pattern.toString()}` }
  }

  return { valid: true, formatted: cleaned, countryName }
}

export function getSupportedCountries() {
  return Object.entries(COUNTRY_LABELS).map(([code, name]) => ({ code, name }))
}
