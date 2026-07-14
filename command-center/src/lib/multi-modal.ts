export type Modality = "text" | "image" | "pdf" | "table" | "voice"

export interface MultiModalInput {
  id: string
  modality: Modality
  content: string
  mimeType: string
  name: string
  size: number
  preview?: string
}

export interface ProcessedContent {
  text: string
  metadata: Record<string, string | number>
  tokens: number
}

const STORAGE_KEY = "cos-multimodal-history"

function loadHistory(): MultiModalInput[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveHistory(history: MultiModalInput[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-100)))
}

export async function processImage(file: File): Promise<ProcessedContent> {
  const text = await file.text().catch(() => "")
  const sizeKB = file.size / 1024
  return {
    text: `[Image: ${file.name} (${sizeKB.toFixed(0)}KB)]\n${text.slice(0, 500)}`,
    metadata: { fileName: file.name, sizeKB: parseFloat(sizeKB.toFixed(1)), mimeType: file.type },
    tokens: Math.ceil(sizeKB / 2),
  }
}

export async function processPdf(file: File): Promise<ProcessedContent> {
  const text = await file.text().catch(() => "")
  const sizeKB = file.size / 1024
  const pages = Math.max(1, Math.floor(sizeKB / 50))
  return {
    text: `[PDF: ${file.name} — ${pages} pages, ${sizeKB.toFixed(0)}KB]\n${text.slice(0, 1000)}`,
    metadata: { fileName: file.name, pages, sizeKB: parseFloat(sizeKB.toFixed(1)) },
    tokens: Math.ceil(sizeKB / 4),
  }
}

export async function processTable(file: File): Promise<ProcessedContent> {
  const text = await file.text().catch(() => "")
  const rows = text.split("\n").filter((l) => l.trim()).length
  const cols = text.split("\n")[0]?.split(",").length || 0
  return {
    text: `[Table: ${file.name} — ${rows} rows × ${cols} cols]\n${text.slice(0, 800)}`,
    metadata: { fileName: file.name, rows, cols, sizeKB: parseFloat((file.size / 1024).toFixed(1)) },
    tokens: Math.ceil(file.size / 4 / 4),
  }
}

export async function processVoice(file: File): Promise<ProcessedContent> {
  const duration = Math.max(1, Math.floor(file.size / 16000))
  return {
    text: `[Voice note: ${file.name} — ${duration}s, ${(file.size / 1024).toFixed(0)}KB]\nTranscript not available (simulated).`,
    metadata: { fileName: file.name, durationSec: duration, sizeKB: parseFloat((file.size / 1024).toFixed(1)) },
    tokens: Math.ceil(duration * 10),
  }
}

export async function processFile(file: File): Promise<ProcessedContent> {
  const modality = detectModality(file)
  switch (modality) {
    case "image": return processImage(file)
    case "pdf": return processPdf(file)
    case "table": return processTable(file)
    case "voice": return processVoice(file)
    default:
      return { text: `[File: ${file.name}]`, metadata: { fileName: file.name }, tokens: 0 }
  }
}

export function detectModality(file: File): Modality {
  const type = file.type.toLowerCase()
  const ext = file.name.split(".").pop()?.toLowerCase() || ""
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image"
  if (type === "application/pdf" || ext === "pdf") return "pdf"
  if (type.includes("csv") || type.includes("spreadsheet") || ["csv", "xlsx", "xls", "tsv"].includes(ext)) return "table"
  if (type.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(ext)) return "voice"
  return "text"
}

export function addToHistory(input: MultiModalInput): void {
  const history = loadHistory()
  history.push(input)
  saveHistory(history)
}

export function getMultiModalHistory(): MultiModalInput[] {
  return loadHistory()
}
