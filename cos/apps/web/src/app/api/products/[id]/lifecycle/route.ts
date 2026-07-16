import { NextRequest, NextResponse } from "next/server"
import { productRegistry } from "@/core/products"
import { validateBody } from "@/lib/validate"
import { ProductLifecycleSchema } from "@/lib/api-schemas"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { data, errors } = validateBody(ProductLifecycleSchema, body)
  if (errors) return NextResponse.json({ error: errors }, { status: 400 })

  const p = productRegistry.get(id)
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  let result: any

  switch (data.action) {
    case "install":
      result = productRegistry.install(id)
      break
    case "activate":
      result = productRegistry.activate(id)
      break
    case "configure":
      result = productRegistry.configure(id, p.config)
      break
    case "start":
      result = productRegistry.start(id)
      break
    case "disable":
      result = productRegistry.disable(id)
      break
    case "enable":
      result = productRegistry.enable(id)
      break
    case "uninstall":
      result = productRegistry.uninstall(id)
      break
    default:
      return NextResponse.json({ error: `Unknown action: ${data.action}` }, { status: 400 })
  }

  if (result.error) return NextResponse.json({ error: result.error, errors: result.errors }, { status: 400 })

  return NextResponse.json({
    id,
    lifecycle: result.pkg.lifecycle,
    availableActions: result.pkg.lifecycle,
  })
}
