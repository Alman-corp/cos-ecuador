import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await req.json()

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const access = await prisma.portalAccess.findFirst({
      where: { email: email.toLowerCase().trim() },
    })

    if (!access) {
      return NextResponse.json({ error: 'Access not found' }, { status: 404 })
    }

    const valid = bcrypt.compareSync(currentPassword, access.tempPassword)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid current password' }, { status: 401 })
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 12)

    await prisma.portalAccess.update({
      where: { id: access.id },
      data: {
        tempPassword: hashedNewPassword,
        passwordReset: true,
        lastAccessAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
