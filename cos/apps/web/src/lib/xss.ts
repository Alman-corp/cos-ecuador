import xss from "xss"

const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed", "form"],
}

export function sanitize<T>(input: T): T {
  if (typeof input === "string") {
    return xss(input, xssOptions) as T
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitize(item)) as T
  }
  if (input && typeof input === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[key] = sanitize(value)
    }
    return result as T
  }
  return input
}
