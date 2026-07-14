export interface AuditEntry {
  id: string
  timestamp: string
  action: string
  userId: string
  resource: string
  details: string
  previousHash: string
  hash: string
}

const STORAGE_KEY = "cos-audit-log"

function sha256(msg: string): Promise<string> {
  const enc = new TextEncoder().encode(msg)
  return crypto.subtle.digest("SHA-256", enc).then((b) =>
    Array.from(new Uint8Array(b))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  )
}

function loadChain(): AuditEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveChain(chain: AuditEntry[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chain))
}

export async function appendAudit(
  action: string,
  userId: string,
  resource: string,
  details: string
): Promise<AuditEntry> {
  const chain = loadChain()
  const previousHash = chain.length > 0 ? chain[chain.length - 1].hash : "0".repeat(64)
  const id = crypto.randomUUID()
  const timestamp = new Date().toISOString()
  const raw = `${id}|${timestamp}|${action}|${userId}|${resource}|${details}|${previousHash}`
  const hash = await sha256(raw)

  const entry: AuditEntry = { id, timestamp, action, userId, resource, details, previousHash, hash }
  chain.push(entry)
  saveChain(chain)
  return entry
}

export async function verifyChain(): Promise<{ valid: boolean; entries: number; firstBreak?: number }> {
  const chain = loadChain()
  if (chain.length === 0) return { valid: true, entries: 0 }

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i]
    const expectedPrev = i === 0 ? "0".repeat(64) : chain[i - 1].hash
    if (entry.previousHash !== expectedPrev) {
      return { valid: false, entries: chain.length, firstBreak: i }
    }
    const raw = `${entry.id}|${entry.timestamp}|${entry.action}|${entry.userId}|${entry.resource}|${entry.details}|${entry.previousHash}`
    const computed = await sha256(raw)
    if (computed !== entry.hash) {
      return { valid: false, entries: chain.length, firstBreak: i }
    }
  }
  return { valid: true, entries: chain.length }
}

export function getAuditLog(): AuditEntry[] {
  return loadChain()
}

export function clearAuditLog(): void {
  localStorage.removeItem(STORAGE_KEY)
}
