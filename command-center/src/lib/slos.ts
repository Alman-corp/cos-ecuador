export interface Slo {
  id: string
  name: string
  description: string
  target: number
  windowDays: number
  totalEvents: number
  goodEvents: number
  budgetBurned: number
  exhausted: boolean
}

const STORAGE_KEY = "cos-slos"

function loadSloStore(): Slo[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveSloStore(slos: Slo[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slos))
}

export function createSlo(name: string, target: number, windowDays: number = 30, description: string = ""): Slo {
  const slos = loadSloStore()
  const slo: Slo = {
    id: crypto.randomUUID(), name, description, target, windowDays,
    totalEvents: 0, goodEvents: 0, budgetBurned: 0, exhausted: false,
  }
  slos.push(slo)
  saveSloStore(slos)
  return slo
}

export function recordSloEvent(sloId: string, success: boolean): void {
  const slos = loadSloStore()
  const slo = slos.find((s) => s.id === sloId)
  if (!slo) return

  slo.totalEvents++
  if (success) slo.goodEvents++

  const availability = slo.totalEvents > 0 ? slo.goodEvents / slo.totalEvents : 1
  slo.budgetBurned = Math.max(0, (slo.target - availability) * 100)
  slo.exhausted = slo.budgetBurned >= 100
  saveSloStore(slos)
}

export function getSloList(): Slo[] {
  return loadSloStore()
}

export function getErrorBudgetStatus(): { healthy: number; warning: number; exhausted: number } {
  const slos = loadSloStore()
  return {
    healthy: slos.filter((s) => !s.exhausted && s.budgetBurned < 50).length,
    warning: slos.filter((s) => !s.exhausted && s.budgetBurned >= 50).length,
    exhausted: slos.filter((s) => s.exhausted).length,
  }
}

export function canShip(): boolean {
  return !loadSloStore().some((s) => s.exhausted)
}
