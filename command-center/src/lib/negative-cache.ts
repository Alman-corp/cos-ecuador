export interface CacheEntry {
  query: string
  response: string
  timestamp: number
  hits: number
  ttl: number
}

const CACHE_KEY = "cos-negative-cache"
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

function loadCache(): CacheEntry[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]") }
  catch { return [] }
}

function saveCache(cache: CacheEntry[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache.filter((e) => Date.now() < e.ttl)))
}

function normalizeQuery(query: string): string {
  return query.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim()
}

export function getCachedResponse(query: string): string | null {
  const cache = loadCache()
  const normalized = normalizeQuery(query)
  const entry = cache.find((e) => normalizeQuery(e.query) === normalized && Date.now() < e.ttl)
  if (entry) {
    entry.hits++
    saveCache(cache)
    return entry.response
  }
  return null
}

export function setCachedResponse(query: string, response: string, ttl: number = DEFAULT_TTL): void {
  const cache = loadCache()
  const normalized = normalizeQuery(query)
  const existing = cache.findIndex((e) => normalizeQuery(e.query) === normalized)
  const entry: CacheEntry = { query, response, timestamp: Date.now(), hits: 0, ttl: Date.now() + ttl }

  if (existing >= 0) cache[existing] = entry
  else cache.push(entry)

  saveCache(cache)
}

export function getCacheStats(): { size: number; totalHits: number; hitRate: number } {
  const cache = loadCache()
  const totalHits = cache.reduce((a, e) => a + e.hits, 0)
  return {
    size: cache.length,
    totalHits,
    hitRate: cache.length > 0 ? parseFloat((totalHits / (totalHits + cache.length) * 100).toFixed(1)) : 0,
  }
}

export function invalidateCache(query?: string): void {
  if (query) {
    const cache = loadCache().filter((e) => normalizeQuery(e.query) !== normalizeQuery(query))
    saveCache(cache)
  } else {
    saveCache([])
  }
}
