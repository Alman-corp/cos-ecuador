import { VectorStore } from "../packages/rag/src/qdrant-client"

async function main() {
  const store = new VectorStore({ url: process.env.QDRANT_URL ?? "http://localhost:6333" })
  await store.ensureCollection()
  console.log("Collection cos_documents ready")

  const memoryStore = new VectorStore({ url: process.env.QDRANT_URL ?? "http://localhost:6333", collectionName: "cos_memory" })
  await memoryStore.ensureCollection()
  console.log("Collection cos_memory ready")

  const stats = await store.getCollectionStats()
  console.log("Stats:", stats)
}

main().catch((e) => {
  console.error("Init failed:", e)
  process.exit(1)
})
