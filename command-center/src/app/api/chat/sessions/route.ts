import { NextRequest, NextResponse } from 'next/server';

const ORCHESTRATOR_URL = process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8009';

export async function GET(req: NextRequest) {
  const session = JSON.parse(req.headers.get('x-cos-session') || '{}');
  const url = new URL(req.url);
  const limit = url.searchParams.get('limit') || '50';

  const res = await fetch(`${ORCHESTRATOR_URL}/api/v1/chat/sessions?limit=${limit}`, {
    headers: {
      'X-Tenant-Id': session.tenant_id || 'default',
      'X-User-Id': session.user_id || 'default',
      'Authorization': `Bearer ${session.access_token || ''}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = JSON.parse(req.headers.get('x-cos-session') || '{}');
  const url = new URL(req.url);
  const sessionId = url.pathname.split('/').pop();

  const res = await fetch(`${ORCHESTRATOR_URL}/api/v1/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'X-Tenant-Id': session.tenant_id || 'default',
      'X-User-Id': session.user_id || 'default',
      'Authorization': `Bearer ${session.access_token || ''}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
