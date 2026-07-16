import * as Sentry from "@sentry/nextjs"

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context })
  } else {
    console.error("[Sentry mock]", error, context)
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level)
  } else {
    console.log(`[Sentry mock] ${level}: ${message}`)
  }
}

export function setUser(id: string, email?: string) {
  Sentry.setUser({ id, email })
}

export function setTags(tags: Record<string, string>) {
  Sentry.setTags(tags)
}
