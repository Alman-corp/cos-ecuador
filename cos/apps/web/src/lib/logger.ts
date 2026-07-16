import pino from "pino"

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug")

const targets: pino.TransportMultiOptions["targets"] = []

if (process.env.NODE_ENV !== "production") {
  targets.push({ target: "pino-pretty", options: { colorize: true }, level })
} else {
  targets.push({ target: "pino/file", options: {}, level })
  if (process.env.LOGTAIL_TOKEN) {
    targets.push({ target: "@logtail/pino", options: { sourceToken: process.env.LOGTAIL_TOKEN }, level: "info" })
  }
}

export const logger = pino({
  level,
  ...(targets.length > 1 || process.env.NODE_ENV !== "production"
    ? { transport: { targets } }
    : {}),
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "body.password", "body.token", "body.secret"],
    censor: "[REDACTED]",
  },
  serializers: {
    req: (r) => ({ method: r.method, url: r.url }),
    err: pino.stdSerializers.err,
  },
})

export function createRequestLogger(req: Request) {
  const start = Date.now()
  const requestId = crypto.randomUUID().slice(0, 8)
  const url = new URL(req.url)

  return {
    requestId,
    info(message: string, data?: Record<string, unknown>) {
      logger.info({ requestId, method: req.method, path: url.pathname, ...data }, message)
    },
    warn(message: string, data?: Record<string, unknown>) {
      logger.warn({ requestId, method: req.method, path: url.pathname, ...data }, message)
    },
    error(message: string, data?: Record<string, unknown>) {
      logger.error({ requestId, method: req.method, path: url.pathname, ...data }, message)
    },
    done() {
      const duration = Date.now() - start
      logger.info({ requestId, method: req.method, path: url.pathname, durationMs: duration }, "request completed")
    },
  }
}
