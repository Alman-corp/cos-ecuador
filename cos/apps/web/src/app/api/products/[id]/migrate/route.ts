import { NextRequest, NextResponse } from "next/server"
import { productRegistry, versionManager } from "@/core/products"
import { validateBody } from "@/lib/validate"
import { ProductMigrateSchema } from "@/lib/api-schemas"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { data, errors } = validateBody(ProductMigrateSchema, body)
  if (errors) return NextResponse.json({ error: errors }, { status: 400 })

  const p = productRegistry.get(id)
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  if (data.direction === "down" && data.targetVersion) {
    const result = await versionManager.rollback(id, p.migrationVersion || "0.0.0", data.targetVersion)
    if (!result.success) return NextResponse.json({ error: "Rollback failed", applied: result.reverted }, { status: 400 })
    return NextResponse.json({ id, version: result.version, reverted: result.reverted })
  }

  const result = await versionManager.migrate(id, p.migrationVersion, data.targetVersion)
  if (!result.success) return NextResponse.json({ error: "Migration failed", applied: result.applied }, { status: 400 })

  return NextResponse.json({ id, version: result.version, applied: result.applied })
}
