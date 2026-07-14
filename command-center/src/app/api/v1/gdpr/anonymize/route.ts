import { NextResponse } from 'next/server'
import { anonymizeUserData } from '@/lib/gdpr/gdpr-service'

export async function POST() {
  try {
    const result = await anonymizeUserData('current-user')
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Error anonymizing data' }, { status: 500 })
  }
}
