export interface AnalyticsEvent {
  id: string
  name: string
  properties: Record<string, string | number | boolean>
  timestamp: number
  sessionId: string
  userId: string
}

export interface PageView {
  path: string
  title: string
  timestamp: number
  duration: number | null
  sessionId: string
}

const STORAGE_KEY = "cos-analytics-events"
const PAGE_VIEWS_KEY = "cos-page-views"
const SESSION_KEY = "cos-session-id"

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let sid = sessionStorage.getItem(SESSION_KEY)
  if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, sid) }
  return sid
}

function loadEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveEvents(events: AnalyticsEvent[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-2000)))
}

function loadPageViews(): PageView[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(PAGE_VIEWS_KEY) || "[]") }
  catch { return [] }
}

function savePageViews(views: PageView[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PAGE_VIEWS_KEY, JSON.stringify(views.slice(-500)))
}

let pageStartTime = Date.now()

export function trackEvent(name: string, properties: Record<string, string | number | boolean> = {}): void {
  const event: AnalyticsEvent = {
    id: crypto.randomUUID(), name, properties, timestamp: Date.now(),
    sessionId: getSessionId(), userId: "demo-user",
  }
  const events = loadEvents()
  events.push(event)
  saveEvents(events)
}

export function trackPageView(path: string, title: string): void {
  const views = loadPageViews()
  const lastView = views[views.length - 1]
  if (lastView && !lastView.duration) {
    lastView.duration = Date.now() - pageStartTime
  }

  pageStartTime = Date.now()
  views.push({ path, title, timestamp: Date.now(), duration: null, sessionId: getSessionId() })
  savePageViews(views)
  trackEvent("page_view", { path, title })
}

export function getEvents(name?: string): AnalyticsEvent[] {
  const events = loadEvents()
  return name ? events.filter((e) => e.name === name) : events
}

export function getPageViews(): PageView[] {
  return loadPageViews()
}

export function getActiveUsers(minutes: number = 5): number {
  const cutoff = Date.now() - minutes * 60_000
  const sessions = new Set(loadEvents().filter((e) => e.timestamp >= cutoff).map((e) => e.sessionId))
  return sessions.size
}

export function getTopPages(limit: number = 10): { path: string; views: number }[] {
  const views = loadPageViews()
  const counts: Record<string, number> = {}
  for (const v of views) counts[v.path] = (counts[v.path] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([path, views]) => ({ path, views }))
}
