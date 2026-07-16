import { NextResponse } from "next/server"
import { platformVersion, certification, productRegistry } from "@/core/platform"

export async function GET() {
  const allProducts = productRegistry.getAll()
  const certified: any[] = []

  for (const pkg of allProducts) {
    const report = await certification.certify(pkg)
    certified.push({
      id: pkg.manifest.id,
      name: pkg.manifest.name,
      certified: report.certified,
      passed: report.passed,
      failed: report.failed,
      total: report.total,
    })
  }

  return NextResponse.json({
    version: platformVersion,
    health: "ok",
    products: productRegistry.getSummary(),
    certification: {
      certified: certified.filter((c) => c.certified).length,
      failed: certified.filter((c) => !c.certified).length,
      details: certified,
    },
  })
}
