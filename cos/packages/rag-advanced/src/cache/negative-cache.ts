import crypto from "crypto"

export class NegativeCache<T> {
  private positive = new Map<string, { value: T; timestamp: number }>()
  private negative = new Map<string, { value: T | null; timestamp: number }>()
  private ttlMs: number
  private maxSize: number
  private hits = 0
  private misses = 0

  constructor(opts?: { ttlMs?: number; maxSize?: number }) {
    this.ttlMs = opts?.ttlMs ?? 5 * 60 * 1000
    this.maxSize = opts?.maxSize ?? 5000
  }

  get(key: string): T | null {
    const hashed = this.hash(key)
    const pos = this.positive.get(hashed)
    if (pos && Date.now() - pos.timestamp < this.ttlMs) {
      this.hits++
      return pos.value
    }
    const neg = this.negative.get(hashed)
    if (neg && Date.now() - neg.timestamp < this.ttlMs) {
      this.hits++
      return null
    }
    this.misses++
    if (pos) this.positive.delete(hashed)
    if (neg) this.negative.delete(hashed)
    return undefined as unknown as T
  }

  set(key: string, value: T | null): void {
    const hashed = this.hash(key)
    if (value === null) {
      this.negative.set(hashed, { value: null, timestamp: Date.now() })
    } else {
      this.positive.set(hashed, { value, timestamp: Date.now() })
    }
    this.evict()
  }

  invalidate(key: string): void {
    const hashed = this.hash(key)
    this.positive.delete(hashed)
    this.negative.delete(hashed)
  }

  invalidateAll(): void {
    this.positive.clear()
    this.negative.clear()
  }

  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses
    return {
      size: this.positive.size + this.negative.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
    }
  }

  private hash(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16)
  }

  private evict(): void {
    if (this.positive.size + this.negative.size <= this.maxSize) return
    const all = [...this.positive.entries(), ...this.negative.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = all.slice(0, Math.ceil(this.maxSize * 0.2))
    for (const [k] of toDelete) {
      this.positive.delete(k)
      this.negative.delete(k)
    }
  }
}
