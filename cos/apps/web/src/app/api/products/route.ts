import { NextResponse } from "next/server"
import { productRegistry } from "@/core/products"

export async function GET() {
  const summary = productRegistry.getSummary()
  const packages = productRegistry.getAll().map((p) => ({
    manifest: p.manifest,
    dna: p.dna
      ? { name: p.dna.name, version: p.dna.version, description: p.dna.description, modules: p.dna.modules || p.dna.categories || [] }
      : null,
    lifecycle: p.lifecycle,
    installed: p.lifecycle !== "discovered",
    installedAt: p.installedAt,
    activatedAt: p.activatedAt,
    configuredAt: p.configuredAt,
    config: p.config,
    migrationVersion: p.migrationVersion,
  }))

  return NextResponse.json({ summary, packages })
}
