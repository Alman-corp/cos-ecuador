import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (companyId) {
      query = query.eq("company_id", companyId)
    }

    const unreadOnly = searchParams.get("unreadOnly")
    if (unreadOnly === "true") {
      query = query.eq("is_read", false)
    }

    const offset = parseInt(searchParams.get("offset") ?? "0", 10)
    const limit = parseInt(searchParams.get("limit") ?? "50", 10)
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [], total: count ?? 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
