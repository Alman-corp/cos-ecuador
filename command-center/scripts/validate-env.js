/**
 * validate-env.js
 *
 * Verifies that critical environment variables are set at build/start time
 * based on the current NODE_ENV.
 *
 * Usage:
 *   node scripts/validate-env.js
 *   NODE_ENV=production node scripts/validate-env.js
 */

const required = {
  production: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "SENTRY_DSN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "SENTRY_AUTH_TOKEN",
  ],
  development: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
  ],
  test: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ],
}

const env = process.env.APP_ENV || process.env.NODE_ENV || "development"
const vars = required[env] || required.development
let missing = false

console.log(`\n🔍 Validating environment variables for \`${env}\`…\n`)

for (const v of vars) {
  if (!process.env[v]) {
    console.error(`  ✗ MISSING  ${v}`)
    missing = true
  } else {
    console.log(`  ✓ OK       ${v}`)
  }
}

if (missing) {
  console.error(`\n❌ One or more required env vars are missing for \`${env}\`.\n`)
  process.exit(1)
} else {
  console.log(`\n✅ All required env vars are set for \`${env}\`.\n`)
  process.exit(0)
}
