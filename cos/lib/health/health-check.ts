import { PrismaClient } from '@prisma/client'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  timestamp: string
  uptime: number
  dependencies: {
    database: DependencyStatus
  }
}

interface DependencyStatus {
  status: 'connected' | 'disconnected' | 'degraded'
  latencyMs: number
  error?: string
}

const startTime = Date.now()

export async function checkHealth(
  prisma: PrismaClient
): Promise<HealthStatus> {
  const dependencies = {
    database: await checkDatabase(prisma),
  }

  const allHealthy = Object.values(dependencies).every(
    (d) => d.status === 'connected'
  )
  const anyDisconnected = Object.values(dependencies).some(
    (d) => d.status === 'disconnected'
  )

  return {
    status: allHealthy ? 'healthy' : anyDisconnected ? 'unhealthy' : 'degraded',
    version: process.env.APP_VERSION || '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    dependencies,
  }
}

async function checkDatabase(prisma: PrismaClient): Promise<DependencyStatus> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'connected', latencyMs: Date.now() - start }
  } catch (error: any) {
    return { status: 'disconnected', latencyMs: Date.now() - start, error: error.message }
  }
}
