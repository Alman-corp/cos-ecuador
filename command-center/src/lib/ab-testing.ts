export interface AbTest {
  id: string
  name: string
  description: string
  variants: string[]
  weights: number[]
  traffic: number
  enabled: boolean
  results: Record<string, { impressions: number; conversions: number }>
  createdAt: string
}

const STORAGE_KEY = "cos-ab-tests"
const ASSIGNMENT_KEY = "cos-ab-assignments"

function loadTests(): AbTest[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveTests(tests: AbTest[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tests))
}

function loadAssignments(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(ASSIGNMENT_KEY) || "{}") }
  catch { return {} }
}

function saveAssignments(assignments: Record<string, string>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(assignments))
}

export function createAbTest(name: string, variants: string[], weights?: number[], trafficPercent: number = 100): AbTest {
  const tests = loadTests()
  if (!weights) {
    const equal = 100 / variants.length
    weights = variants.map(() => equal)
  }
  const test: AbTest = {
    id: crypto.randomUUID(), name, description: "", variants, weights, traffic: trafficPercent,
    enabled: true,
    results: Object.fromEntries(variants.map((v) => [v, { impressions: 0, conversions: 0 }])),
    createdAt: new Date().toISOString(),
  }
  tests.push(test)
  saveTests(tests)
  return test
}

export function getAssignment(testId: string, userId: string = "demo-user"): string | null {
  const tests = loadTests()
  const test = tests.find((t) => t.id === testId)
  if (!test || !test.enabled) return null

  if (Math.random() * 100 > test.traffic) return null

  const assignments = loadAssignments()
  const key = `${testId}:${userId}`
  if (assignments[key]) return assignments[key]

  const rand = Math.random() * 100
  let cumulative = 0
  for (let i = 0; i < test.variants.length; i++) {
    cumulative += test.weights[i]
    if (rand <= cumulative) {
      assignments[key] = test.variants[i]
      saveAssignments(assignments)
      test.results[test.variants[i]].impressions++
      saveTests(tests)
      return test.variants[i]
    }
  }

  const fallback = test.variants[0]
  assignments[key] = fallback
  saveAssignments(assignments)
  return fallback
}

export function trackConversion(testId: string, variant: string): void {
  const tests = loadTests()
  const test = tests.find((t) => t.id === testId)
  if (!test) return
  if (test.results[variant]) test.results[variant].conversions++
  saveTests(tests)
}

export function getAbTests(): AbTest[] {
  return loadTests()
}

export function getConversionRate(testId: string): Record<string, number> {
  const tests = loadTests()
  const test = tests.find((t) => t.id === testId)
  if (!test) return {}
  const rates: Record<string, number> = {}
  for (const [variant, data] of Object.entries(test.results)) {
    rates[variant] = data.impressions > 0 ? parseFloat(((data.conversions / data.impressions) * 100).toFixed(1)) : 0
  }
  return rates
}
