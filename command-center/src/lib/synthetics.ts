import { log, recordMetric } from "@/lib/otel"

export interface SyntheticCheck {
  id: string
  name: string
  endpoint: string
  method: "GET" | "POST" | "HEAD"
  interval: number
  lastRun: number | null
  lastDuration: number | null
  lastStatus: "pass" | "fail" | null
  enabled: boolean
  timeout: number
}

export interface CheckResult {
  checkId: string
  timestamp: number
  duration: number
  status: "pass" | "fail"
  error?: string
  statusCode?: number
}

const STORAGE_KEY = "cos-synthetic-checks"
const RESULTS_KEY = "cos-synthetic-results"

function loadChecks(): SyntheticCheck[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveChecks(checks: SyntheticCheck[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checks))
}

function loadResults(): CheckResult[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || "[]") }
  catch { return [] }
}

function saveResults(results: CheckResult[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results.slice(-500)))
}

export function createCheck(name: string, endpoint: string, method: "GET" | "POST" | "HEAD" = "GET", intervalMinutes: number = 5): SyntheticCheck {
  const checks = loadChecks()
  const check: SyntheticCheck = {
    id: crypto.randomUUID(), name, endpoint, method,
    interval: intervalMinutes * 60_000, lastRun: null, lastDuration: null,
    lastStatus: null, enabled: true, timeout: 10_000,
  }
  checks.push(check)
  saveChecks(checks)
  return check
}

export function listChecks(): SyntheticCheck[] {
  return loadChecks()
}

export async function runCheck(check: SyntheticCheck): Promise<CheckResult> {
  const start = performance.now()
  let result: CheckResult

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), check.timeout)
    const res = await fetch(check.endpoint, { method: check.method, signal: controller.signal })
    clearTimeout(timeout)

    const duration = performance.now() - start
    result = { checkId: check.id, timestamp: Date.now(), duration, status: "pass", statusCode: res.status }
    log("info", `Synthetic check ${check.name} passed (${duration.toFixed(0)}ms)`)

    check.lastRun = Date.now()
    check.lastDuration = duration
    check.lastStatus = "pass"
  } catch (err) {
    const duration = performance.now() - start
    result = { checkId: check.id, timestamp: Date.now(), duration, status: "fail", error: (err as Error).message }
    log("error", `Synthetic check ${check.name} failed: ${(err as Error).message}`)

    check.lastRun = Date.now()
    check.lastDuration = duration
    check.lastStatus = "fail"
  }

  const results = loadResults()
  results.push(result)
  saveResults(results)
  saveChecks(loadChecks().map((c) => c.id === check.id ? check : c))

  recordMetric("synthetic_check_duration", result.duration, "ms", { check: check.name, status: result.status })
  return result
}

export function getResults(checkId: string): CheckResult[] {
  return loadResults().filter((r) => r.checkId === checkId)
}

export function getAllResults(): CheckResult[] {
  return loadResults()
}

export function deleteCheck(id: string): boolean {
  const checks = loadChecks().filter((c) => c.id !== id)
  if (checks.length === loadChecks().length) return false
  saveChecks(checks)
  return true
}
