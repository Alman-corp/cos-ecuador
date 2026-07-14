export interface Span {
  id: string
  traceId: string
  parentId: string | null
  operation: string
  startTime: number
  endTime: number | null
  duration: number | null
  status: "ok" | "error"
  attributes: Record<string, string | number | boolean>
  events: { name: string; timestamp: number; attributes?: Record<string, string> }[]
}

export interface Metric {
  name: string
  value: number
  unit: string
  tags: Record<string, string>
  timestamp: number
}

export interface LogEntry {
  id: string
  traceId: string | null
  spanId: string | null
  level: "debug" | "info" | "warn" | "error"
  message: string
  attributes: Record<string, string | number | boolean>
  timestamp: number
}

let currentTraceId: string | null = null
let spanStack: Span[] = []
const spans: Span[] = []
const metrics: Metric[] = []
const logs: LogEntry[] = []

export function startTrace(name: string): string {
  currentTraceId = crypto.randomUUID()
  startSpan(name)
  return currentTraceId
}

export function startSpan(operation: string, attributes?: Record<string, string | number | boolean>): Span {
  const id = crypto.randomUUID()
  const parentId = spanStack.length > 0 ? spanStack[spanStack.length - 1].id : null
  const span: Span = {
    id, traceId: currentTraceId || crypto.randomUUID(), parentId,
    operation, startTime: performance.now(), endTime: null, duration: null,
    status: "ok", attributes: attributes || {}, events: [],
  }
  spanStack.push(span)
  spans.push(span)
  return span
}

export function endSpan(status: "ok" | "error" = "ok"): void {
  const span = spanStack.pop()
  if (!span) return
  span.endTime = performance.now()
  span.duration = span.endTime - span.startTime
  span.status = status
}

export function addSpanEvent(name: string, attrs?: Record<string, string>): void {
  const span = spanStack[spanStack.length - 1]
  if (!span) return
  span.events.push({ name, timestamp: performance.now(), attributes: attrs })
}

export function recordMetric(name: string, value: number, unit: string = "count", tags: Record<string, string> = {}): void {
  metrics.push({ name, value, unit, tags, timestamp: Date.now() })
}

export function log(level: LogEntry["level"], message: string, attrs: Record<string, string | number | boolean> = {}): void {
  const span = spanStack[spanStack.length - 1]
  logs.push({
    id: crypto.randomUUID(), traceId: currentTraceId, spanId: span?.id || null,
    level, message, attributes: attrs, timestamp: Date.now(),
  })
}

export function getTraceSpans(traceId: string): Span[] {
  return spans.filter((s) => s.traceId === traceId)
}

export function getRecentMetrics(minutes: number = 60): Metric[] {
  const cutoff = Date.now() - minutes * 60_000
  return metrics.filter((m) => m.timestamp >= cutoff)
}

export function getRecentLogs(minutes: number = 60): LogEntry[] {
  const cutoff = Date.now() - minutes * 60_000
  return logs.filter((l) => l.timestamp >= cutoff).sort((a, b) => b.timestamp - a.timestamp)
}

export function getAllSpans(): Span[] {
  return [...spans]
}

export function exportOtelJson(): string {
  return JSON.stringify({ spans, metrics, logs }, null, 2)
}
