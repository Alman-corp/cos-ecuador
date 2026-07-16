import { NextRequest, NextResponse } from "next/server"
import { certification, productRegistry } from "@/core/platform"
import { validateBody } from "@/lib/validate"
import { CertifyProductSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")

  if (productId) {
    const pkg = productRegistry.get(productId)
    if (!pkg) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    const report = await certification.certify(pkg)
    return NextResponse.json(report)
  }

  const results = []
  for (const pkg of productRegistry.getAll()) {
    results.push(await certification.certify(pkg))
  }

  return NextResponse.json({
    tests: certification.getTests().map((t) => ({ id: t.id, name: t.name, category: t.category })),
    results,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, errors } = validateBody(CertifyProductSchema, body)
  if (errors) return NextResponse.json({ error: errors }, { status: 400 })

  const pkg = productRegistry.get(data.productId)
  if (!pkg) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  const report = await certification.certify(pkg)
  return NextResponse.json(report)
}
