import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDatabase() {
  console.log('Verifying database integrity...\n')
  let hasErrors = false

  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('Connection to PostgreSQL: OK')
  } catch (e) {
    console.error('Connection to PostgreSQL: FAILED', e)
    process.exit(1)
  }

  const tables = [
    'Company', 'User', 'Role', 'Client', 'Project',
    'FinancialStatement', 'Document', 'DueDiligenceJob',
    'AuditLog',
  ]

  for (const table of tables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}"`)
      console.log(`Table ${table}: exists`)
    } catch {
      console.error(`Table ${table}: MISSING or no permissions`)
      hasErrors = true
    }
  }

  const rlsCheck = await prisma.$queryRaw`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT IN ('_prisma_migrations')
  `

  if ((rlsCheck as any[]).length > 0) {
    console.warn(`Tables without RLS: ${(rlsCheck as any[]).map((r: any) => r.tablename).join(', ')}`)
    hasErrors = true
  } else {
    console.log('RLS: enabled on all tables')
  }

  const pending = await prisma.$queryRaw`
    SELECT migration_name FROM _prisma_migrations
    WHERE finished_at IS NULL
  `

  if ((pending as any[]).length > 0) {
    console.warn(`Pending migrations:`, (pending as any[]).map((p: any) => p.migration_name))
    hasErrors = true
  } else {
    console.log('Migrations: all applied')
  }

  console.log('\n' + (hasErrors ? 'Verification FAILED' : 'Verification PASSED'))
  process.exit(hasErrors ? 1 : 0)
}

verifyDatabase().finally(() => prisma.$disconnect())
