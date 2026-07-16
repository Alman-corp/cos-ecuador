import { NextRequest, NextResponse } from "next/server"
import { productRegistry, lifecycleManager, configEngine } from "@/core/products"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const p = productRegistry.get(id)
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  return NextResponse.json({
    manifest: p.manifest,
    dna: p.dna ? { name: p.dna.name, version: p.dna.version, description: p.dna.description, modules: p.dna.modules || p.dna.categories || [] } : null,
    lifecycle: p.lifecycle,
    availableActions: lifecycleManager.getAvailableActions(p.lifecycle),
    config: p.config,
    configSchema: p.manifest.configSchema || null,
    configDefaults: p.manifest.configSchema ? configEngine.getDefaults(p) : null,
    migrationVersion: p.migrationVersion,
  })
}
