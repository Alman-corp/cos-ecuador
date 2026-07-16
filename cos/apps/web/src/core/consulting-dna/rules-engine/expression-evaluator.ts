const COMPARISON_PATTERN = /^(not\s*\()?(.+?)\s*(!=|>=|<=|>|<|=)\s*(.+?)\)?\s*$/i
const LOGICAL_PATTERN = /^(.+?)\s+(and|or)\s+(.+)$/i
const IS_NUMERIC = /^-?\d+(\.\d+)?$/

type Facts = Record<string, unknown>

function resolvePath(obj: Facts, path: string): unknown {
  const parts = path.trim().split(".")
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function coerceValue(val: unknown): number | string | boolean {
  if (typeof val === "number") return val
  if (typeof val === "string") {
    const num = Number(val)
    if (!isNaN(num) && val.trim() !== "") return num
    return val
  }
  if (typeof val === "boolean") return val
  return String(val ?? "")
}

function compare(lhs: unknown, op: string, rhs: unknown): boolean {
  const a = coerceValue(lhs)
  const b = coerceValue(rhs)

  if (typeof a === "number" && typeof b === "number") {
    switch (op) {
      case ">": return a > b
      case "<": return a < b
      case ">=": return a >= b
      case "<=": return a <= b
      case "=":
      case "==": return a === b
      case "!=": return a !== b
    }
  }

  const sa = String(a)
  const sb = String(b)
  switch (op) {
    case "=":
    case "==": return sa === sb
    case "!=": return sa !== sb
    case ">": return sa > sb
    case "<": return sa < sb
    case ">=": return sa >= sb
    case "<=": return sa <= sb
  }

  return false
}

function evaluateComparison(expr: string, facts: Facts): boolean {
  const trimmed = expr.trim()

  if (trimmed.startsWith("not(") && trimmed.endsWith(")")) {
    const inner = trimmed.slice(4, -1)
    return !evaluateExpression(inner, facts)
  }

  const parts = trimmed.match(COMPARISON_PATTERN)
  if (parts) {
    const isNot = !!parts[1]
    const lhsExpr = parts[2].trim()
    const op = parts[3].toLowerCase()
    const rhsExpr = parts[4].trim()

    const isPath = (s: string) => !IS_NUMERIC.test(s.trim()) && s.includes(".")

    const lhsResolved = resolvePath(facts, lhsExpr)
    const rhsResolved = resolvePath(facts, rhsExpr)

    if (lhsResolved === undefined && rhsResolved === undefined) return false
    if (lhsResolved === undefined && isPath(lhsExpr)) return false
    if (rhsResolved === undefined && isPath(rhsExpr)) return false

    const lhs = lhsResolved ?? lhsExpr
    const rhs = rhsResolved ?? rhsExpr
    const result = compare(lhs, op, rhs)
    return isNot ? !result : result
  }

  const val = resolvePath(facts, trimmed)
  if (val !== undefined) return Boolean(val)

  return false
}

export function evaluateExpression(expr: string, facts: Facts): boolean {
  const trimmed = expr.trim()

  if (trimmed === "true") return true
  if (trimmed === "false") return false

  const parenMatch = trimmed.match(/^\((.+)\)$/)
  if (parenMatch) return evaluateExpression(parenMatch[1], facts)

  const logical = trimmed.match(LOGICAL_PATTERN)
  if (logical) {
    const left = logical[1].trim()
    const op = logical[2].toLowerCase()
    const right = logical[3].trim()

    if (op === "and") return evaluateExpression(left, facts) && evaluateExpression(right, facts)
    if (op === "or") return evaluateExpression(left, facts) || evaluateExpression(right, facts)
  }

  return evaluateComparison(trimmed, facts)
}
