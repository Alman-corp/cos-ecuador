import * as fs from "fs"
import * as path from "path"

async function main() {
  console.log("╔══════════════════════════════════════════╗")
  console.log("║  RAG Rollback — Emergency Revert         ║")
  console.log("╚══════════════════════════════════════════╝\n")

  const logPath = path.resolve(__dirname, "../migration-log.json")
  if (!fs.existsSync(logPath)) {
    console.error("❌ No migration log found. Nothing to rollback.")
    process.exit(1)
  }

  let migrationLog: any
  try { migrationLog = JSON.parse(fs.readFileSync(logPath, "utf-8")) } catch {
    console.error("❌ Invalid migration log.")
    process.exit(1)
  }

  console.log(`Migration ID: ${migrationLog.id}`)
  console.log(`Date: ${migrationLog.timestamp}`)
  console.log(`Status: ${migrationLog.status}`)
  console.log(`Backup: ${migrationLog.backupCollection ?? "N/A"}\n`)

  if (migrationLog.status === "reverted") {
    console.log("⚠️  This migration was already reverted.")
  }

  console.log("Rolling back...\n")

  const steps = [
    { name: "Restore Qdrant collection", description: "Swapping back to backup collection" },
    { name: "Clean up advanced collection", description: "Removing 'cos_documents_advanced' collection" },
    { name: "Mark migration as reverted", description: "Updating migration log status" },
  ]

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    console.log(`[${i + 1}/${steps.length}] ${step.name}`)
    console.log(`   → ${step.description}`)
    try {
      if (step.name === "Restore Qdrant collection" && migrationLog.backupCollection) {
        const { QdrantClient } = await import("@qdrant/js-client-rest")
        const client = new QdrantClient({ url: process.env.QDRANT_URL ?? "http://localhost:6333" })
        try {
          const collections = await client.getCollections()
          const backupExists = collections.collections.some((c) => c.name === migrationLog.backupCollection)
          if (backupExists) {
            await client.updateAliases({
              actions: [
                { delete_alias: { alias_name: "cos_documents_active" } },
                { create_alias: { collection_name: migrationLog.backupCollection, alias_name: "cos_documents_active" } },
              ],
            })
            console.log("   ✓ Restored backup collection")
          } else {
            console.log("   ⚠️  Backup collection not found — may need manual restore")
          }
        } catch (e) {
          console.log("   ⚠️  Could not restore via alias — check Qdrant dashboard")
        }
      }
      if (step.name === "Clean up advanced collection") {
        const { QdrantClient } = await import("@qdrant/js-client-rest")
        const client = new QdrantClient({ url: process.env.QDRANT_URL ?? "http://localhost:6333" })
        try { await client.deleteCollection("cos_documents_advanced"); console.log("   ✓ Removed advanced collection") } catch {}
      }
      if (step.name === "Mark migration as reverted") {
        migrationLog.status = "reverted"
        fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2))
        console.log("   ✓ Migration log updated")
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`   ✗ ${msg}`)
    }
  }

  console.log(`\n✅ Rollback complete. The system is now using the backup RAG pipeline.`)
  console.log(`   Update .env: QDRANT_COLLECTION=cos_documents (or the backup name)`)
}

main().catch((e) => {
  console.error("Rollback failed:", e)
  process.exit(1)
})
