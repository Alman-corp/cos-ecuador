const PROVINCE_MIN = 1
const PROVINCE_MAX = 24
const CEDULA_LENGTH = 10
const RUC_LENGTH = 13
const RUC_SUFFIX = "001"
const THIRD_DIGIT_MAX = 10
const PESOS_MOD10 = [2, 1, 2, 1, 2, 1, 2, 1, 2]

function modulo10(digits: string): boolean {
  const digitoVerificador = parseInt(digits[digits.length - 1], 10)
  let suma = 0
  for (let i = 0; i < digits.length - 1; i++) {
    let valor = parseInt(digits[i], 10) * PESOS_MOD10[i]
    if (valor >= 10) valor -= 9
    suma += valor
  }
  const calculado = (10 - (suma % 10)) % 10
  return digitoVerificador === calculado
}

export function validateCedula(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false
  const provincia = parseInt(cedula.substring(0, 2), 10)
  if (provincia < PROVINCE_MIN || provincia > PROVINCE_MAX) return false
  return modulo10(cedula)
}

export function validateRuc(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc)) return false
  const provincia = parseInt(ruc.substring(0, 2), 10)
  if (provincia < PROVINCE_MIN || provincia > PROVINCE_MAX) return false
  const tercerDigito = parseInt(ruc.charAt(2), 10)
  if (tercerDigito >= THIRD_DIGIT_MAX) return false
  if (ruc.substring(10) !== RUC_SUFFIX) return false
  return modulo10(ruc.substring(0, 10))
}

export function validatePhone(phone: string): boolean {
  return /^\+593\d{8,9}$/.test(phone)
}

export function formatCurrency(value: number): string {
  const [int, dec] = value.toFixed(2).split(".")
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formatted},${dec}`
}

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
