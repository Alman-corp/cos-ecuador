import { NextResponse } from 'next/server'
import { checkHealth } from '@/lib/health/health-check'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const health = await checkHealth(prisma)
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}