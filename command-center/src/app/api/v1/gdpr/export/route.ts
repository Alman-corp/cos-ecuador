import { NextResponse } from 'next/server'
import { exportUserData } from '@/lib/gdpr/gdpr-service'

export async function GET() {
  try {
    const { json, filename } = await exportUserData('current-user')
    return NextResponse.json(json)
  } catch (error) {
    return NextResponse.json({ error: 'Error exporting data' }, { status: 500 })
  }
}
