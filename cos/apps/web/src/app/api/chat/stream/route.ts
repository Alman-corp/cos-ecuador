import { NextRequest } from "next/server"

const AI_ORCHESTRATOR_URL = process.env.AI_ORCHESTRATOR_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json()

  const response = await fetch(`${AI_ORCHESTRATOR_URL}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: "default",
      session_id: sessionId || crypto.randomUUID(),
      message,
    }),
  })

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "AI Orchestrator request failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    })
  }

  const data = await response.json()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const chunks = data.response?.match(/.{1,50}/g) || [data.response || ""]
      chunks.forEach((chunk: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk, agentUsed: data.agent_used })}\n\n`))
      })
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}