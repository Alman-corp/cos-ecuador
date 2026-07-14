export interface ExpandedQuery {
  original: string
  hyde: string
  multiQueries: string[]
  stepBack: string
}

const STEP_BACK_TEMPLATES: Record<string, string> = {
  financial: "What are the general principles of financial performance measurement? What metrics determine company health?",
  economic: "What are the fundamental drivers of economic growth? How do macro indicators behave in this context?",
  market: "What are the dynamics of competitive markets? How do companies gain market share?",
  valuation: "What determines the value of a company? What are the standard valuation approaches?",
}

const KNOWN_TOPICS: Record<string, { hyde: string; stepBack: string }> = {
  ebitda: {
    hyde: "EBITDA is $4.2B with margin of 16.5%. The ratio improved 210bps YoY. Operating leverage from SG&A reduction drove the expansion. Sector average is 14.2%.",
    stepBack: "What are the components of profitability? How do operating expenses affect margins?",
  },
  dcf: {
    hyde: "DCF valuation at 12% WACC yields EV of $2.4M. Terminal growth 3.5%. Five-year projection with decaying FCF growth from 15% to 3.5%.",
    stepBack: "How does discounted cash flow valuation work? What are the key assumptions in a DCF model?",
  },
  revenue: {
    hyde: "Revenue grew to $25.4B in Q4 2025, up 4.5% QoQ. Automotive segment $22.8B, Energy $2.1B. Volume growth of 11.2% offset ASP decline of 3%.",
    stepBack: "What drives revenue growth? How do volume and price mix affect total revenue?",
  },
}

export function expandQuery(query: string, context: string = "financial"): ExpandedQuery {
  const lowerQuery = query.toLowerCase()

  // Find known topic or generate
  let hyde = query
  let stepBack = STEP_BACK_TEMPLATES[context] || STEP_BACK_TEMPLATES.financial

  for (const [topic, data] of Object.entries(KNOWN_TOPICS)) {
    if (lowerQuery.includes(topic)) {
      hyde = data.hyde
      stepBack = data.stepBack
      break
    }
  }

  // Multi-query: generate different phrasings
  const multiQueries = [
    query,
    `${query} financial analysis 2025`,
    `${query} Q4 results and metrics`,
    `What does ${query} tell us about performance`,
  ]

  return { original: query, hyde, multiQueries, stepBack }
}

export function executeMultiQuery(query: string, searchFn: (q: string) => { content: string }[], context: string = "financial"): { results: { content: string }[]; expanded: ExpandedQuery } {
  const expanded = expandQuery(query, context)
  const allResults: { content: string }[] = []
  const seen = new Set<string>()

  for (const q of [expanded.original, ...expanded.multiQueries]) {
    for (const r of searchFn(q)) {
      if (!seen.has(r.content)) {
        seen.add(r.content)
        allResults.push(r)
      }
    }
  }

  return { results: allResults, expanded }
}

export function getQueryStrategy(query: string): { shouldSearch: boolean; expand: boolean; depth: "quick" | "deep" | "exhaustive" } {
  const q = query.toLowerCase()
  const questionWords = ["qué", "cómo", "por qué", "cuál", "what", "how", "why", "which"]
  const isQuestion = questionWords.some((w) => q.startsWith(w))
  const hasMetrics = /\d+/.test(q)
  const hasComparison = /compar|vs|versus|vs\.|benchmark/i.test(q)

  return {
    shouldSearch: isQuestion || hasMetrics || hasComparison,
    expand: hasComparison || q.length < 30,
    depth: hasComparison ? "deep" : hasMetrics ? "exhaustive" : "quick",
  }
}
