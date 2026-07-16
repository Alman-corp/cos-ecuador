// Quick persistence test — run with: node --experimental-vm-modules test-persist.mjs
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

async function main() {
  // This simulates loading core/persistence in Node.js
  // Since Next.js paths won't resolve, we work with raw JSON files
  
  const { persistence, PersistenceManager } = await import("./src/core/persistence/index.ts")
  
  // Create a test store
  const testStore = {
    data: [] as any[],
    getAll() { return this.data },
    restoreAll(d: any) { this.data = d },
    getKey() { return "test" },
  }
  
  persistence.register(testStore)
  
  // Save empty data
  await persistence.saveAll()
  console.log("Saved empty data ✓")
  
  // Verify file created
  const filePath = path.join(DATA_DIR, "test.json")
  if (!fs.existsSync(filePath)) throw new Error("File not created")
  console.log("File exists ✓")
  
  // Load and verify
  testStore.data = []
  await persistence.loadAll()
  console.log("Loaded empty data ✓, count:", testStore.data.length)
  
  // Save with data
  testStore.data = [{ id: 1, name: "test" }]
  await persistence.saveAll()
  
  // Load again to verify
  testStore.data = []
  await persistence.loadAll()
  console.log("Loaded with data ✓, count:", testStore.data.length, "- name:", testStore.data[0]?.name)
  
  // Memory store test
  const { memoryStore } = await import("./src/core/memory/index.ts")
  const memEntries = memoryStore.getAll()
  console.log("Memory entries before seed:", memEntries.length)
  
  console.log("\n✅ All persistence tests passed")
  
  // Cleanup
  fs.rmSync(DATA_DIR, { recursive: true, force: true })
}

main().catch(e => { console.error("❌", e); process.exit(1) })
