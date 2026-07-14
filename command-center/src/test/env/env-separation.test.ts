import { describe, it, expect, beforeAll } from "vitest"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const ROOT = path.resolve(__dirname, "../../..")

function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf-8")
  const vars: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key) vars[key] = value
  }
  return vars
}

function runValidateEnv(extraEnv: Record<string, string>): { stdout: string; status: number } {
  try {
    const stdout = execSync("node scripts/validate-env.js", {
      cwd: ROOT,
      encoding: "utf-8",
      env: { ...process.env, ...extraEnv },
    })
    return { stdout, status: 0 }
  } catch (e: any) {
    return { stdout: e.stdout || "", status: e.status ?? 1 }
  }
}

describe("Environment separation — .env files", () => {
  describe(".env.dev.example", () => {
    let vars: Record<string, string>

    beforeAll(() => {
      vars = parseEnvFile(path.join(ROOT, ".env.dev.example"))
    })

    it("contains NEXT_PUBLIC_SUPABASE_URL", () => {
      expect(vars["NEXT_PUBLIC_SUPABASE_URL"]).toBeDefined()
    })

    it("contains NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
      expect(vars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]).toBeDefined()
    })

    it("contains NEXT_PUBLIC_SENTRY_DSN", () => {
      expect(vars["NEXT_PUBLIC_SENTRY_DSN"]).toBeDefined()
    })

    it("does NOT contain production-only vars like SUPABASE_SERVICE_ROLE_KEY", () => {
      expect(vars["SUPABASE_SERVICE_ROLE_KEY"]).toBeUndefined()
    })

    it("does NOT contain SENTRY_AUTH_TOKEN", () => {
      expect(vars["SENTRY_AUTH_TOKEN"]).toBeUndefined()
    })
  })

  describe(".env.staging.example", () => {
    let vars: Record<string, string>

    beforeAll(() => {
      vars = parseEnvFile(path.join(ROOT, ".env.staging.example"))
    })

    it("contains Supabase vars", () => {
      expect(vars["NEXT_PUBLIC_SUPABASE_URL"]).toBeDefined()
      expect(vars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]).toBeDefined()
    })

    it("contains SUPABASE_SERVICE_ROLE_KEY (staging needs it)", () => {
      expect(vars["SUPABASE_SERVICE_ROLE_KEY"]).toBeDefined()
    })

    it("contains Sentry vars (DSN, ORG, PROJECT, AUTH_TOKEN)", () => {
      expect(vars["NEXT_PUBLIC_SENTRY_DSN"]).toBeDefined()
      expect(vars["SENTRY_DSN"]).toBeDefined()
      expect(vars["SENTRY_ORG"]).toBeDefined()
      expect(vars["SENTRY_PROJECT"]).toBeDefined()
      expect(vars["SENTRY_AUTH_TOKEN"]).toBeDefined()
    })
  })

  describe(".env.example (main — all vars)", () => {
    let vars: Record<string, string>

    beforeAll(() => {
      vars = parseEnvFile(path.join(ROOT, ".env.example"))
    })

    it("contains Supabase vars", () => {
      expect(vars["NEXT_PUBLIC_SUPABASE_URL"]).toBeDefined()
      expect(vars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]).toBeDefined()
      expect(vars["SUPABASE_SERVICE_ROLE_KEY"]).toBeDefined()
    })

    it("contains OpenAI var", () => {
      expect(vars["OPENAI_API_KEY"]).toBeDefined()
    })

    it("contains Site URL var", () => {
      expect(vars["NEXT_PUBLIC_SITE_URL"]).toBeDefined()
    })

    it("contains all Sentry vars", () => {
      expect(vars["NEXT_PUBLIC_SENTRY_DSN"]).toBeDefined()
      expect(vars["SENTRY_DSN"]).toBeDefined()
      expect(vars["SENTRY_ORG"]).toBeDefined()
      expect(vars["SENTRY_PROJECT"]).toBeDefined()
      expect(vars["SENTRY_AUTH_TOKEN"]).toBeDefined()
    })

    it("contains NODE_ENV", () => {
      expect(vars["NODE_ENV"]).toBeDefined()
    })
  })
})

describe("scripts/validate-env.js", () => {
  it("passes when all dev vars are set (APP_ENV=development)", () => {
    const { status } = runValidateEnv({
      APP_ENV: "development",
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      NEXT_PUBLIC_SENTRY_DSN: "https://test@test.ingest.sentry.io/0",
    })
    expect(status).toBe(0)
  })

  it("detects missing critical variable in development", () => {
    const { status } = runValidateEnv({
      APP_ENV: "development",
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    })
    expect(status).toBe(1)
  })

  it("passes when all test vars are set (NODE_ENV=test)", () => {
    const { status } = runValidateEnv({
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    })
    expect(status).toBe(0)
  })

  it("detects missing critical variable in production", () => {
    const { status } = runValidateEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    })
    expect(status).toBe(1)
  })
})
