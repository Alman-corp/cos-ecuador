import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.3 : 0.1,
  debug: process.env.NODE_ENV === "development",
  environment: process.env.NODE_ENV,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
