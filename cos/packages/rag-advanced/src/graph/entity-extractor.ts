import type { Entity, Relation, EntityType } from "../types"
import OpenAI from "openai"

export class EntityExtractor {
  private llm: OpenAI

  constructor(opts?: { openAiKey?: string }) {
    this.llm = new OpenAI({ apiKey: opts?.openAiKey ?? process.env.OPENAI_API_KEY })
  }

  async extract(text: string): Promise<{ entities: Entity[]; relations: Relation[] }> {
    try {
      const resp = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Extract entities and relations from the financial text. Entity types: PERSON, ORG, MONEY, DATE, METRIC, PRODUCT, LOCATION. Respond in JSON: {"entities": [{"name":"...","type":"...","properties":{}}], "relations": [{"source":"...","target":"...","relation":"...","weight":0.5}]}' },
          { role: "user", content: text },
        ],
      })
      const parsed = JSON.parse(resp.choices[0]?.message?.content ?? "{}")
      const entities: Entity[] = (parsed.entities ?? []).map((e: any, i: number) => ({
        id: `ent-${i}`,
        name: e.name,
        canonical_name: this.canonicalize(e.name),
        type: this.validateType(e.type),
        properties: e.properties ?? {},
      }))
      const relations: Relation[] = (parsed.relations ?? []).map((r: any, i: number) => ({
        id: `rel-${i}`,
        source: `ent-${r.source ?? 0}`,
        target: `ent-${r.target ?? 1}`,
        relation: r.relation,
        weight: r.weight ?? 0.5,
      }))
      return { entities, relations }
    } catch {
      return { entities: [], relations: [] }
    }
  }

  private canonicalize(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
  }

  private validateType(type: string): EntityType {
    const valid: EntityType[] = ["PERSON", "ORG", "MONEY", "DATE", "METRIC", "PRODUCT", "LOCATION"]
    return valid.includes(type as EntityType) ? (type as EntityType) : "ORG"
  }

  normalizeEntityName(name: string): string {
    const map: Record<string, string> = {
      "tsla": "tesla",
      "tesla inc": "tesla",
      "tesla inc.": "tesla",
      "tesla motors": "tesla",
      "elon": "elon musk",
      "ebitda margin": "ebitda",
      "gross margin": "gross margin",
      "free cash flow": "fcf",
      "energy storage": "energy storage",
    }
    const key = name.toLowerCase().trim()
    return map[key] ?? name
  }
}
