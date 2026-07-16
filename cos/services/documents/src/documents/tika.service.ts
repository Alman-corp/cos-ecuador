import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class TikaService {
  private baseUrl: string

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get("TIKA_URL", "http://localhost:9998")
  }

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/tika`, {
        method: "PUT",
        body: buffer,
        headers: {
          "Content-Type": mimeType || "application/octet-stream",
          Accept: "text/plain",
        },
      })
      if (!response.ok) return ""
      return response.text()
    } catch {
      return ""
    }
  }

  async extractMetadata(buffer: Buffer, mimeType: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/meta`, {
        method: "PUT",
        body: buffer,
        headers: { "Content-Type": mimeType || "application/octet-stream" },
      })
      if (!response.ok) return {}
      return response.json()
    } catch {
      return {}
    }
  }

  async detectLanguage(buffer: Buffer): Promise<string> {
    try {
      const text = await this.extractText(buffer, "application/octet-stream")
      const response = await fetch(`${this.baseUrl}/language/stream`, {
        method: "PUT",
        body: text,
        headers: { "Content-Type": "text/plain" },
      })
      if (!response.ok) return "unknown"
      return response.text()
    } catch {
      return "unknown"
    }
  }
}
