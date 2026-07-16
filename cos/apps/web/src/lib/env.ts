import { z } from "zod"

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),

  // Auth
  TOKEN_SECRET: z.string().min(32, "TOKEN_SECRET must be at least 32 characters"),

  // Supabase (legacy — will be removed in Capa 1)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // Stripe (optional for local dev)
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // LLM (optional — falls back to rule engine)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Storage (S3-compatible — defaults to MinIO in dev)
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional().default("info"),

  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
})

export type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues
      .filter((i) => i.code === "invalid_type" && i.message.includes("Required"))
      .map((i) => i.path.join("."))
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
          "Copy .env.example to .env.local and fill in the required values."
      )
    }
    throw new Error(`Environment validation failed:\n${result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`)
  }
  return result.data
}

export const env = parseEnv()
