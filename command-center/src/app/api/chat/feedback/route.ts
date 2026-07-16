import { NextRequest, NextResponse } from 'next/server';

const ORCHESTRATOR_URL = process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8009';

export async function POST(req: NextRequest) {
  const session = JSON.parse(req.headers.get('x-cos-session') || '{}');
  const body = await req.json();

  const res = await fetch(`${ORCHESTRATOR_URL}/api/v1/chat/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': session.tenant_id || 'default',
      'X-User-Id': session.user_id || 'default',
      'Authorization': `Bearer ${session.access_token || ''}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
