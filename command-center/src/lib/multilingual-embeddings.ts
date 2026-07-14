export type Language = "es" | "en" | "pt"
export type EmbeddingModel = "multilingual-e5" | "bge-m3"

export interface MultilingualDocument {
  id: string
  text: string
  language: Language
  translation: Record<Language, string>
  embedding: number[]
}

const TRANSLATION_MAP: Record<string, Record<Language, string>> = {
  revenue: { en: "revenue", es: "ingresos", pt: "receita" },
  ebitda: { en: "EBITDA", es: "EBITDA", pt: "EBITDA" },
  margin: { en: "margin", es: "margen", pt: "margem" },
  growth: { en: "growth", es: "crecimiento", pt: "crescimento" },
  cash_flow: { en: "cash flow", es: "flujo de caja", pt: "fluxo de caixa" },
  valuation: { en: "valuation", es: "valuación", pt: "avaliação" },
  debt: { en: "debt", es: "deuda", pt: "dívida" },
  profit: { en: "profit", es: "ganancia", pt: "lucro" },
  investment: { en: "investment", es: "inversión", pt: "investimento" },
  risk: { en: "risk", es: "riesgo", pt: "risco" },
}

const MULTILINGUAL_DOCS: MultilingualDocument[] = [
  {
    id: "ml-1",
    text: "Tesla reported Q4 2025 revenue of $25.4B, EBITDA margin of 16.5%",
    language: "en",
    translation: {
      en: "Tesla reported Q4 2025 revenue of $25.4B, EBITDA margin of 16.5%",
      es: "Tesla reportó ingresos del Q4 2025 de $25.4B, margen EBITDA de 16.5%",
      pt: "Tesla reportou receita do Q4 2025 de $25.4B, margem EBITDA de 16.5%",
    },
    embedding: [],
  },
  {
    id: "ml-2",
    text: "El flujo de caja libre alcanzó $6.2B en el año fiscal 2025",
    language: "es",
    translation: {
      en: "Free cash flow reached $6.2B in fiscal year 2025",
      es: "El flujo de caja libre alcanzó $6.2B en el año fiscal 2025",
      pt: "O fluxo de caixa livre atingiu $6.2B no ano fiscal de 2025",
    },
    embedding: [],
  },
  {
    id: "ml-3",
    text: "A avaliação DCF com WACC de 12% resulta em valor de empresa de $2.4M",
    language: "pt",
    translation: {
      en: "DCF valuation with 12% WACC yields enterprise value of $2.4M",
      es: "La valuación DCF con WACC del 12% arroja un valor de empresa de $2.4M",
      pt: "A avaliação DCF com WACC de 12% resulta em valor de empresa de $2.4M",
    },
    embedding: [],
  },
  {
    id: "ml-4",
    text: "Tesla mantiene $44.1B en efectivo, la posición de liquidez más fuerte del sector",
    language: "es",
    translation: {
      en: "Tesla holds $44.1B in cash, the strongest liquidity position in the sector",
      es: "Tesla mantiene $44.1B en efectivo, la posición de liquidez más fuerte del sector",
      pt: "Tesla mantém $44.1B em dinheiro, a posição de liquidez mais forte do setor",
    },
    embedding: [],
  },
]

function simulateEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean)
  const vector = new Array(16).fill(0)
  for (let i = 0; i < words.length; i++) {
    const hash = words[i].split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    vector[i % 16] += (hash % 100) / 100
  }
  const magnitude = Math.sqrt(vector.reduce((a, v) => a + v * v, 0))
  return vector.map((v) => v / (magnitude || 1))
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1)
}

export function detectLanguage(text: string): Language {
  const es = /[¿¡áéíóúñ]/i
  const pt = /[ãõçêâôà]/i
  if (pt.test(text)) return "pt"
  if (es.test(text)) return "es"
  return "en"
}

export function translateQuery(query: string, targetLang: Language): string {
  const words = query.toLowerCase().split(/\W+/).filter(Boolean)
  const translated = words.map((w) => {
    for (const [, langs] of Object.entries(TRANSLATION_MAP)) {
      if (Object.values(langs).includes(w)) return langs[targetLang]
    }
    return w
  })
  return translated.join(" ")
}

export function embed(text: string, model: EmbeddingModel = "multilingual-e5"): number[] {
  const prefix = model === "bge-m3" ? "" : "query: "
  return simulateEmbedding(prefix + text)
}

export function searchMultilingual(query: string, targetLanguage?: Language): MultilingualDocument[] {
  const lang = targetLanguage || detectLanguage(query)
  const queryEmb = embed(query)

  // Translate query and embed in each language
  const queries: Record<Language, string> = {
    en: translateQuery(query, "en"),
    es: translateQuery(query, "es"),
    pt: translateQuery(query, "pt"),
  }

  const scored = MULTILINGUAL_DOCS.map((doc) => {
    const docText = doc.translation[lang]
    const docEmb = embed(docText)
    const score = cosineSimilarity(queryEmb, docEmb)
    return { ...doc, score }
  })

  return scored.sort((a, b) => b.score - a.score)
}

export function getMultilingualDocs(): MultilingualDocument[] {
  return MULTILINGUAL_DOCS
}

export function addMultilingualDoc(text: string, language: Language): MultilingualDocument {
  const doc: MultilingualDocument = {
    id: `ml-${MULTILINGUAL_DOCS.length + 1}`, text, language,
    translation: {
      en: translateQuery(text, "en"),
      es: translateQuery(text, "es"),
      pt: translateQuery(text, "pt"),
    },
    embedding: embed(text),
  }
  MULTILINGUAL_DOCS.push(doc)
  return doc
}
