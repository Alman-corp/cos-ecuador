import { describe, it, expect } from "vitest"
import { chunkDocument } from "../../../packages/rag/src/chunker"

describe("Chunker", () => {
  it("divide un texto largo en chunks con overlap", () => {
    const text = Array.from({ length: 100 }, (_, i) => `Oracion ${i + 1} con contenido.`).join(" ")
    const chunks = chunkDocument(text, "doc-1", { strategy: "fixed", maxChunkSize: 500, chunkOverlap: 100 })
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach((c) => {
      expect(c.document_id).toBe("doc-1")
      expect(c.metadata.char_count).toBeGreaterThan(0)
    })
  })

  it("detecta secciones en hierarchical mode", () => {
    const text = `# Introduccion\nContenido introductorio.\n\n## Seccion A\nTexto de la seccion A.\n\n## Seccion B\nTexto de la seccion B.`
    const chunks = chunkDocument(text, "doc-1", { strategy: "hierarchical" })
    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks.some((c) => c.heading_path.length > 0)).toBe(true)
  })
})
