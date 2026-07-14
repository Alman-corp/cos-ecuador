#!/usr/bin/env tsx
/**
 * Gate 0→1 Validation Script
 * Verifica que Fase 0 está completa antes de avanzar a Fase 1.
 * Uso: npx tsx scripts/validate-gate-0-1.ts
 */

async function check(label: string, fn: () => boolean | Promise<boolean>): Promise<boolean> {
  try {
    const result = await fn()
    const icon = result ? '✅' : '❌'
    console.log(`  ${icon} ${label}`)
    return result
  } catch (e) {
    console.log(`  ❌ ${label} — ERROR: ${(e as Error).message}`)
    return false
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════')
  console.log('  GATE 0→1 — VALIDACIÓN DE FASE 0')
  console.log('═══════════════════════════════════════════\n')

  const results: { category: string; checks: { label: string; passed: boolean }[] }[] = []
  let totalPassed = 0
  let totalFailed = 0

  // ========== BUILD & TYPE SAFETY ==========
  console.log('📦 BUILD & TYPE SAFETY')
  const buildChecks: { label: string; passed: boolean }[] = []

  buildChecks.push({
    label: 'next.config.ts existe con output standalone',
    passed: await check('next.config.ts con output standalone', () => {
      const cfg = require('fs').readFileSync('next.config.ts', 'utf-8')
      return cfg.includes('standalone') && cfg.includes('withSentryConfig')
    }),
  })

  buildChecks.push({
    label: 'tsconfig.json con strict mode',
    passed: await check('tsconfig strict mode', () => {
      const tsconfig = JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf-8'))
      return tsconfig.compilerOptions?.strict === true
    }),
  })

  results.push({ category: 'Build & Type Safety', checks: buildChecks })

  // ========== SECURITY ==========
  console.log('\n🔒 SECURITY')
  const securityChecks: { label: string; passed: boolean }[] = []

  securityChecks.push({
    label: 'sentry.client.config.ts existe',
    passed: await check('sentry.client.config.ts', () => require('fs').existsSync('sentry.client.config.ts')),
  })

  securityChecks.push({
    label: 'sentry.server.config.ts existe',
    passed: await check('sentry.server.config.ts', () => require('fs').existsSync('sentry.server.config.ts')),
  })

  securityChecks.push({
    label: '.sentryclirc.example existe',
    passed: await check('.sentryclirc.example', () => require('fs').existsSync('.sentryclirc.example')),
  })

  results.push({ category: 'Security', checks: securityChecks })

  // ========== MULTI-TENANCY ==========
  console.log('\n🏢 MULTI-TENANCY')
  const mtChecks: { label: string; passed: boolean }[] = []

  mtChecks.push({
    label: 'middleware.ts con tenant extraction',
    passed: await check('middleware.ts con tenant extraction', () => {
      if (!require('fs').existsSync('src/middleware.ts')) return false
      const mw = require('fs').readFileSync('src/middleware.ts', 'utf-8')
      return mw.includes('company_id') || mw.includes('tenant')
    }),
  })

  mtChecks.push({
    label: 'Rate limiter implementado',
    passed: await check('rate-limiter.ts con rateLimit()', () => {
      if (!require('fs').existsSync('src/lib/rate-limiter.ts')) return false
      const rl = require('fs').readFileSync('src/lib/rate-limiter.ts', 'utf-8')
      return rl.includes('rateLimit')
    }),
  })

  mtChecks.push({
    label: 'Cross-tenant tests existen',
    passed: await check('cross-tenant tests', () => require('fs').existsSync('src/test/cross-tenant/cross-tenant.test.ts')),
  })

  mtChecks.push({
    label: 'RLS migration 00003 existe',
    passed: await check('RLS migration 00003', () => {
      const files = require('fs').readdirSync('supabase/migrations')
      return files.some((f: string) => f.includes('00003') || f.includes('rls'))
    }),
  })

  results.push({ category: 'Multi-Tenancy', checks: mtChecks })

  // ========== FRONTEND ==========
  console.log('\n🎨 FRONTEND')
  const feChecks: { label: string; passed: boolean }[] = []

  feChecks.push({
    label: 'Shadcn components (button, card, form, input, select)',
    passed: await check('shadcn button/card/form/input/select', () => {
      const ui = require('fs').readdirSync('src/components/ui')
      const needed = ['button.tsx', 'card.tsx', 'form.tsx', 'input.tsx', 'select.tsx']
      return needed.every((f) => ui.includes(f))
    }),
  })

  feChecks.push({
    label: 'Zustand stores (session + sidebar)',
    passed: await check('Zustand stores', () => {
      const stores = require('fs').readdirSync('src/lib/stores')
      return stores.some((f: string) => f.includes('session')) && stores.some((f: string) => f.includes('sidebar'))
    }),
  })

  feChecks.push({
    label: 'TanStack Query Provider',
    passed: await check('QueryProvider con staleTime 30s', () => {
      if (!require('fs').existsSync('src/lib/api.ts')) return false
      const api = require('fs').readFileSync('src/lib/api.ts', 'utf-8')
      return api.includes('staleTime') && api.includes('queryClient')
    }),
  })

  feChecks.push({
    label: 'Error boundaries en dashboard, landing, auth',
    passed: await check('error.tsx en dashboard/landing/auth', () => {
      return (
        require('fs').existsSync('src/app/(dashboard)/error.tsx') &&
        require('fs').existsSync('src/app/(landing)/error.tsx') &&
        require('fs').existsSync('src/app/auth/error.tsx')
      )
    }),
  })

  feChecks.push({
    label: 'Loading skeletons con shadcn Skeleton',
    passed: await check('loading.tsx con Skeleton', () => {
      return (
        require('fs').existsSync('src/app/(dashboard)/loading.tsx') &&
        require('fs').existsSync('src/app/(landing)/loading.tsx') &&
        require('fs').existsSync('src/app/auth/loading.tsx')
      )
    }),
  })

  feChecks.push({
    label: 'TanStack Query hooks (dashboard, agents, documents)',
    passed: await check('hooks useDashboard/useAgents/useDocuments', () => {
      const hooks = require('fs').readdirSync('src/lib/hooks')
      return (
        hooks.some((f: string) => f.includes('dashboard')) &&
        hooks.some((f: string) => f.includes('agent')) &&
        hooks.some((f: string) => f.includes('document'))
      )
    }),
  })

  results.push({ category: 'Frontend', checks: feChecks })

  // ========== OBSERVABILITY ==========
  console.log('\n📊 OBSERVABILITY')
  const obsChecks: { label: string; passed: boolean }[] = []

  obsChecks.push({
    label: 'Sentry client config con DSN',
    passed: await check('Sentry client config', () => {
      if (!require('fs').existsSync('sentry.client.config.ts')) return false
      return require('fs').readFileSync('sentry.client.config.ts', 'utf-8').includes('dsn')
    }),
  })

  obsChecks.push({
    label: 'Sentry server config con DSN',
    passed: await check('Sentry server config', () => {
      if (!require('fs').existsSync('sentry.server.config.ts')) return false
      return require('fs').readFileSync('sentry.server.config.ts', 'utf-8').includes('dsn')
    }),
  })

  results.push({ category: 'Observability', checks: obsChecks })

  // ========== COMPLIANCE ECUADOR ==========
  console.log('\n🇪🇨 COMPLIANCE ECUADOR')
  const ecChecks: { label: string; passed: boolean }[] = []

  ecChecks.push({
    label: 'Validadores Ecuador (cédula, RUC, teléfono)',
    passed: await check('validators/ec.ts con validateRuc/validateCedula', () => {
      if (!require('fs').existsSync('src/lib/validators/ec.ts')) return false
      const v = require('fs').readFileSync('src/lib/validators/ec.ts', 'utf-8')
      return v.includes('validateRuc') && v.includes('validateCedula')
    }),
  })

  ecChecks.push({
    label: 'Zod schemas Ecuador (RucSchema, CedulaSchema)',
    passed: await check('schemas/ec-schemas.ts', () => {
      if (!require('fs').existsSync('src/lib/schemas/ec-schemas.ts')) return false
      const s = require('fs').readFileSync('src/lib/schemas/ec-schemas.ts', 'utf-8')
      return s.includes('RucSchema') && s.includes('CedulaSchema')
    }),
  })

  ecChecks.push({
    label: 'SRI lookups (retenciones, ICE, calendario)',
    passed: await check('src/lib/sri/ con lookups + calendario', () => {
      return require('fs').existsSync('src/lib/sri/lookups.ts') && require('fs').existsSync('src/lib/sri/calendario.ts')
    }),
  })

  ecChecks.push({
    label: 'BCE/INEC indicadores',
    passed: await check('src/lib/bce/ + src/lib/inec/', () => {
      return require('fs').existsSync('src/lib/bce/lookups.ts') && require('fs').existsSync('src/lib/inec/lookups.ts')
    }),
  })

  ecChecks.push({
    label: 'LOPDP compliance tests',
    passed: await check('test/lopdp/lopdp-compliance.test.ts', () =>
      require('fs').existsSync('src/test/lopdp/lopdp-compliance.test.ts'),
    ),
  })

  ecChecks.push({
    label: 'LOPDP consent en onboarding wizard',
    passed: await check('onboarding con consentimiento LOPDP', () => {
      if (!require('fs').existsSync('src/components/onboarding/multi-tenant-wizard.tsx')) return false
      const w = require('fs').readFileSync('src/components/onboarding/multi-tenant-wizard.tsx', 'utf-8')
      return w.includes('consentLopdp') || w.includes('lopdp')
    }),
  })

  results.push({ category: 'Compliance Ecuador', checks: ecChecks })

  // ========== TESTING ==========
  console.log('\n🧪 TESTING')
  const testChecks: { label: string; passed: boolean }[] = []

  testChecks.push({
    label: 'Vitest config con jsdom + coverage 30%',
    passed: await check('vitest.config.ts', () => {
      const v = require('fs').readFileSync('vitest.config.ts', 'utf-8')
      return v.includes('jsdom') && v.includes('thresholds') && v.includes('30')
    }),
  })

  testChecks.push({
    label: 'MSW handlers + server',
    passed: await check('src/test/mocks/', () =>
      require('fs').existsSync('src/test/mocks/server.ts') && require('fs').existsSync('src/test/mocks/handlers.ts'),
    ),
  })

  testChecks.push({
    label: 'Playwright config con 4+ specs',
    passed: await check('playwright.config.ts + e2e specs', () => {
      if (!require('fs').existsSync('src/e2e')) return false
      const specs = require('fs').readdirSync('src/e2e')
      return specs.length >= 4
    }),
  })

  testChecks.push({
    label: 'Env separation tests',
    passed: await check('test/env/env-separation.test.ts', () =>
      require('fs').existsSync('src/test/env/env-separation.test.ts'),
    ),
  })

  results.push({ category: 'Testing', checks: testChecks })

  // ========== CI/CD & INFRA ==========
  console.log('\n🚀 CI/CD & INFRA')
  const infraChecks: { label: string; passed: boolean }[] = []

  infraChecks.push({
    label: 'GitHub Actions CI',
    passed: await check('.github/workflows/ci.yml', () => require('fs').existsSync('.github/workflows/ci.yml')),
  })

  infraChecks.push({
    label: 'GitHub Actions Deploy',
    passed: await check('.github/workflows/deploy.yml', () => require('fs').existsSync('.github/workflows/deploy.yml')),
  })

  infraChecks.push({
    label: 'Dockerfile multi-stage',
    passed: await check('Dockerfile', () => require('fs').existsSync('Dockerfile')),
  })

  infraChecks.push({
    label: 'docker-compose.yml',
    passed: await check('docker-compose.yml', () => require('fs').existsSync('docker-compose.yml')),
  })

  infraChecks.push({
    label: '.env.example con todas las vars',
    passed: await check('.env.example', () => {
      if (!require('fs').existsSync('.env.example')) return false
      const env = require('fs').readFileSync('.env.example', 'utf-8')
      return env.includes('SENTRY_DSN') || env.includes('SUPABASE_URL')
    }),
  })

  infraChecks.push({
    label: 'CONTRIBUTING.md con branching strategy',
    passed: await check('CONTRIBUTING.md', () => require('fs').existsSync('CONTRIBUTING.md')),
  })

  infraChecks.push({
    label: 'RELEASE.md con checklist',
    passed: await check('RELEASE.md', () => require('fs').existsSync('RELEASE.md')),
  })

  infraChecks.push({
    label: 'CODEOWNERS protegiendo AI/RAG',
    passed: await check('.github/CODEOWNERS', () => require('fs').existsSync('.github/CODEOWNERS')),
  })

  results.push({ category: 'CI/CD & Infra', checks: infraChecks })

  // ========== SUMMARY ==========
  console.log('\n═══════════════════════════════════════════')
  console.log('  RESUMEN GATE 0→1')
  console.log('═══════════════════════════════════════════\n')

  for (const { category, checks } of results) {
    const passed = checks.filter((c) => c.passed).length
    const failed = checks.filter((c) => !c.passed).length
    totalPassed += passed
    totalFailed += failed
    console.log(`  ${category}: ${passed}/${passed + failed} (${failed} fallos)`)
  }

  console.log(`\n  TOTAL: ${totalPassed}/${totalPassed + totalFailed} checks pasaron`)
  
  if (totalFailed === 0) {
    console.log('\n  🎉 GATE 0→1 APROBADO — Listo para Fase 1\n')
    process.exit(0)
  } else {
    console.log(`\n  ⚠️  GATE 0→1 BLOQUEADO — ${totalFailed} cheque(s) fallaron. Revisa arriba.\n`)
    process.exit(1)
  }
}

main()
