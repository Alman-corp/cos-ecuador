type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN"

interface CircuitConfig {
  failureThreshold: number
  successThreshold: number
  timeout: number
  name: string
}

interface CircuitEntry {
  state: CircuitState
  failures: number
  successes: number
  lastFailure: number
  lastStateChange: number
  config: CircuitConfig
}

const circuits = new Map<string, CircuitEntry>()
const MAX_CIRCUIT_AGE_MS = 3_600_000

function sweepStaleCircuits(): void {
  const now = Date.now()
  for (const [name, entry] of circuits) {
    if (now - entry.lastStateChange > MAX_CIRCUIT_AGE_MS && entry.state === "CLOSED") {
      circuits.delete(name)
    }
  }
}

export function createCircuit(name: string, config?: Partial<CircuitConfig>): CircuitEntry {
  const defaultConfig: CircuitConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30_000,
    name,
  }
  const entry: CircuitEntry = {
    state: "CLOSED",
    failures: 0,
    successes: 0,
    lastFailure: 0,
    lastStateChange: Date.now(),
    config: { ...defaultConfig, ...config },
  }
  circuits.set(name, entry)
  return entry
}

export function getCircuitState(name: string): "OPEN" | "CLOSED" | "HALF_OPEN" {
  const circuit = circuits.get(name)
  if (!circuit) return "CLOSED"

  if (circuit.state === "OPEN") {
    if (Date.now() - circuit.lastStateChange > circuit.config.timeout) {
      circuit.state = "HALF_OPEN"
      circuit.successes = 0
      circuit.lastStateChange = Date.now()
    }
  }

  return circuit.state
}

export function recordSuccess(name: string): void {
  const circuit = circuits.get(name)
  if (!circuit) return

  if (circuit.state === "HALF_OPEN") {
    circuit.successes++
    if (circuit.successes >= circuit.config.successThreshold) {
      circuit.state = "CLOSED"
      circuit.failures = 0
      circuit.successes = 0
      circuit.lastStateChange = Date.now()
    }
  }

  if (circuit.state === "CLOSED") {
    circuit.failures = Math.max(0, circuit.failures - 1)
  }
}

export function recordFailure(name: string): void {
  const circuit = circuits.get(name)
  if (!circuit) return

  circuit.failures++
  circuit.lastFailure = Date.now()

  if (
    circuit.state === "CLOSED" &&
    circuit.failures >= circuit.config.failureThreshold
  ) {
    circuit.state = "OPEN"
    circuit.lastStateChange = Date.now()
  }

  if (circuit.state === "HALF_OPEN") {
    circuit.state = "OPEN"
    circuit.lastStateChange = Date.now()
  }
}

export async function circuitProtected<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: () => T,
  config?: Partial<CircuitConfig>
): Promise<T> {
  if (!circuits.has(name)) {
    sweepStaleCircuits()
    createCircuit(name, config)
  }

  if (getCircuitState(name) === "OPEN") {
    return fallback()
  }

  try {
    const result = await fn()
    recordSuccess(name)
    return result
  } catch {
    recordFailure(name)
    return fallback()
  }
}
