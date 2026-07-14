type JobStatus = "pending" | "running" | "completed" | "failed"
type JobHandler = (job: Job) => Promise<void>

interface Job {
  id: string
  type: string
  data: unknown
  status: JobStatus
  attempts: number
  maxAttempts: number
  lastError?: string
  createdAt: number
  updatedAt: number
}

const jobs: Job[] = []
const MAX_COMPLETED_JOBS = 100
const handlers = new Map<string, JobHandler>()
let processing = false

export function registerJobHandler(type: string, handler: JobHandler): void {
  handlers.set(type, handler)
}

export function enqueue(type: string, data: unknown, maxAttempts = 3): string {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  jobs.push({
    id,
    type,
    data,
    status: "pending",
    attempts: 0,
    maxAttempts,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  processQueue()
  return id
}

export function getJob(id: string): Job | undefined {
  return jobs.find((j) => j.id === id)
}

export function getJobsByType(type: string): Job[] {
  return jobs.filter((j) => j.type === type)
}

function exponentialBackoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30_000)
}

async function processQueue(): Promise<void> {
  if (processing) return
  processing = true

  while (true) {
    const job = jobs.find((j) => j.status === "pending" || j.status === "failed")
    if (!job) break

    const handler = handlers.get(job.type)
    if (!handler) {
      job.status = "failed"
      job.lastError = `No handler registered for type: ${job.type}`
      job.updatedAt = Date.now()
      continue
    }

    job.status = "running"
    job.attempts++
    job.updatedAt = Date.now()

    try {
      await handler(job)
      job.status = "completed"
      job.updatedAt = Date.now()
    } catch (error) {
      if (job.attempts >= job.maxAttempts) {
        job.status = "failed"
        job.lastError = error instanceof Error ? error.message : "Unknown error"
      } else {
        job.status = "pending"
        const delay = exponentialBackoff(job.attempts)
        await new Promise((r) => setTimeout(r, delay))
      }
      job.updatedAt = Date.now()
    }
  }

  processing = false

  const completedCount = jobs.filter((j) => j.status === "completed" || j.status === "failed").length
  if (completedCount > MAX_COMPLETED_JOBS) {
    const toRemove = completedCount - MAX_COMPLETED_JOBS
    let removed = 0
    for (let i = jobs.length - 1; i >= 0 && removed < toRemove; i--) {
      if (jobs[i].status === "completed" || jobs[i].status === "failed") {
        jobs.splice(i, 1)
        removed++
      }
    }
  }
}
