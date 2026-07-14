export type RunbookTrigger = "synthetic_failure" | "error_budget_exhausted" | "high_latency" | "service_down" | "manual"
export type RunbookAction = "restart_service" | "clear_cache" | "scale_up" | "rollback" | "notify_slack" | "webhook" | "script"
export type RunbookStatus = "idle" | "running" | "success" | "failed"

export interface RunbookStep {
  id: string
  action: RunbookAction
  label: string
  target: string
  status: RunbookStatus
  result?: string
  duration?: number
}

export interface Runbook {
  id: string
  name: string
  description: string
  trigger: RunbookTrigger
  steps: RunbookStep[]
  createdAt: string
  lastRun: string | null
  lastStatus: RunbookStatus | null
}

const STORAGE_KEY = "cos-runbooks"
const RUN_LOG_KEY = "cos-runbook-logs"

function loadRunbooks(): Runbook[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveRunbooks(runbooks: Runbook[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runbooks))
}

function loadRunLogs(): { runbookId: string; timestamp: number; status: RunbookStatus }[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(RUN_LOG_KEY) || "[]") }
  catch { return [] }
}

function saveRunLogs(logs: { runbookId: string; timestamp: number; status: RunbookStatus }[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(RUN_LOG_KEY, JSON.stringify(logs.slice(-200)))
}

export function createRunbook(name: string, description: string, trigger: RunbookTrigger, steps: Omit<RunbookStep, "id" | "status">[]): Runbook {
  const runbooks = loadRunbooks()
  const runbook: Runbook = {
    id: crypto.randomUUID(), name, description, trigger,
    steps: steps.map((s) => ({ ...s, id: crypto.randomUUID(), status: "idle" as RunbookStatus })),
    createdAt: new Date().toISOString(), lastRun: null, lastStatus: null,
  }
  runbooks.push(runbook)
  saveRunbooks(runbooks)
  return runbook
}

export function listRunbooks(): Runbook[] {
  return loadRunbooks()
}

export async function executeRunbook(id: string): Promise<Runbook> {
  const runbooks = loadRunbooks()
  const runbook = runbooks.find((r) => r.id === id)
  if (!runbook) throw new Error("Runbook not found")

  runbook.lastRun = new Date().toISOString()
  runbook.lastStatus = "running"

  for (const step of runbook.steps) {
    step.status = "running"
    saveRunbooks(runbooks)

    const start = performance.now()
    try {
      const actionFn = ACTION_HANDLERS[step.action]
      await actionFn(step.target)
      step.status = "success"
      step.duration = performance.now() - start
      step.result = "OK"
    } catch (err) {
      step.status = "failed"
      step.duration = performance.now() - start
      step.result = (err as Error).message
      runbook.lastStatus = "failed"
      saveRunbooks(runbooks)
      saveRunLogs([...loadRunLogs(), { runbookId: id, timestamp: Date.now(), status: "failed" }])
      return runbook
    }
  }

  runbook.lastStatus = "success"
  saveRunbooks(runbooks)
  saveRunLogs([...loadRunLogs(), { runbookId: id, timestamp: Date.now(), status: "success" }])
  return runbook
}

const ACTION_HANDLERS: Record<RunbookAction, (target: string) => Promise<void>> = {
  restart_service: async (target) => { await new Promise((r) => setTimeout(r, 800)); if (Math.random() > 0.9) throw new Error("Service restart failed") },
  clear_cache: async (target) => { await new Promise((r) => setTimeout(r, 400)) },
  scale_up: async (target) => { await new Promise((r) => setTimeout(r, 1200)) },
  rollback: async (target) => { await new Promise((r) => setTimeout(r, 2000)); if (Math.random() > 0.85) throw new Error("Rollback failed") },
  notify_slack: async (target) => { await new Promise((r) => setTimeout(r, 300)) },
  webhook: async (target) => { await new Promise((r) => setTimeout(r, 600)) },
  script: async (target) => { await new Promise((r) => setTimeout(r, 1500)) },
}

export function getRunbookLogs(): { runbookId: string; timestamp: number; status: RunbookStatus }[] {
  return loadRunLogs()
}
