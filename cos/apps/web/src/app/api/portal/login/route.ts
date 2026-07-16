import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.PORTAL_JWT_SECRET || 'cos-due-diligence-portal-secret-2026'
)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const access = await prisma.portalAccess.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: { job: true },
    })

    if (!access) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (new Date() > access.expiresAt) {
      return NextResponse.json({ error: 'Access expired' }, { status: 401 })
    }

    const valid = bcrypt.compareSync(password, access.tempPassword)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!access.passwordReset) {
      await prisma.portalAccess.update({
        where: { id: access.id },
        data: { passwordReset: true, lastAccessAt: new Date() },
      })
    } else {
      await prisma.portalAccess.update({
        where: { id: access.id },
        data: { lastAccessAt: new Date() },
      })
    }

    const token = await new SignJWT({
      sub: access.id,
      email: access.email,
      jobId: access.jobId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET)

    const isFirstLogin = !access.passwordReset

    const response = NextResponse.json({
      success: true,
      isFirstLogin,
      companyName: access.job.targetCompanyName,
      jobId: access.jobId,
    })

    response.cookies.set('portal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/portal',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Portal login error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
