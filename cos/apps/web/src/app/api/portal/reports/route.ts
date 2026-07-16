import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.PORTAL_JWT_SECRET || 'cos-due-diligence-portal-secret-2026'
)

async function verifyPortalAuth(req: NextRequest) {
  const token = req.cookies.get('portal_token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const access = await prisma.portalAccess.findUnique({
      where: { id: payload.sub as string },
      include: {
        job: {
          include: { company: true },
        },
      },
    })

    if (!access || new Date() > access.expiresAt) return null

    return access
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const access = await verifyPortalAuth(req)
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      companyName: access.job.targetCompanyName,
      reportUrl: access.job.reportUrl || `/api/reports/${access.job.id}/pdf`,
      completedAt: access.job.completedAt?.toISOString(),
      consultantName: access.job.clientName || 'Consultor asignado',
      consultantFirm: access.job.company?.name || 'Firma de consultor\u00eda',
      expiresAt: access.expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Portal reports error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
