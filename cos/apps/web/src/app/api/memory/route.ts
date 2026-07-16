import { NextRequest, NextResponse } from "next/server"
import { memoryStore, memoryGraph } from "@/core/memory"
import { validateBody } from "@/lib/validate"
import { StoreMemorySchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get("companyId") || "default"
  const clientId = searchParams.get("clientId") || undefined
  const type = searchParams.get("type") || undefined
  const limit = parseInt(searchParams.get("limit") || "50", 10)

  const results = memoryStore.query({
    companyId,
    clientId,
    type: type as any,
    limit,
  })

  return NextResponse.json({ entries: results, total: results.length })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, errors } = validateBody(StoreMemorySchema, body)
  if (errors) return NextResponse.json({ error: errors }, { status: 400 })
  const entry = memoryStore.store({
    ...data,
    metadata: data.metadata ?? {},
    importance: data.importance ?? "medium",
    entities: data.entities ?? [],
    tags: data.tags ?? [],
  })
  return NextResponse.json(entry, { status: 201 })
}
