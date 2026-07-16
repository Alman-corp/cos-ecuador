import { NextRequest } from 'next/server';

const ORCHESTRATOR_URL = process.env.AI_ORCHESTRATOR_URL || 'http://localhost:8009';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = JSON.parse(req.headers.get('x-cos-session') || '{}');

  const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': session.tenant_id || 'default',
      'X-User-Id': session.user_id || 'default',
      'Authorization': `Bearer ${session.access_token || ''}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return new Response(await response.text(), { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
