import { NextRequest, NextResponse } from "next/server"
import { productRegistry } from "@/core/products"
import { validateBody } from "@/lib/validate"
import { ProductConfigSchema } from "@/lib/api-schemas"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { data, errors } = validateBody(ProductConfigSchema, body)
  if (errors) return NextResponse.json({ error: errors }, { status: 400 })

  const p = productRegistry.get(id)
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const result = productRegistry.configure(id, data)
  if (result.error) return NextResponse.json({ error: result.error, errors: result.errors }, { status: 400 })

  return NextResponse.json({ id, config: result.pkg!.config, lifecycle: result.pkg!.lifecycle })
}
