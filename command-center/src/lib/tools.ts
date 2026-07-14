export type ToolStatus = "pending" | "running" | "done" | "error"

export interface ToolCall {
  id: string
  name: string
  params: Record<string, unknown>
  status: ToolStatus
  result?: string
  error?: string
}

export interface ToolDefinition {
  name: string
  description: string
  schema: Record<string, { type: string; required?: boolean; description?: string; enum?: string[] }>
  execute: (params: Record<string, unknown>) => Promise<string>
}

function validateParams(params: Record<string, unknown>, schema: ToolDefinition["schema"]): string[] {
  const errors: string[] = []
  for (const [key, def] of Object.entries(schema)) {
    if (def.required && (params[key] === undefined || params[key] === null)) {
      errors.push(`Missing required parameter: ${key}`)
    }
    if (params[key] !== undefined && def.enum && !def.enum.includes(String(params[key]))) {
      errors.push(`Invalid value for ${key}: must be one of [${def.enum.join(", ")}]`)
    }
  }
  return errors
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "query_financials",
    description: "Query financial metrics for a given period",
    schema: {
      metric: { type: "string", required: true, description: "Metric name (revenue, ebitda, net_income, fcf, cash)" },
      period: { type: "string", required: true, enum: ["Q1_2025", "Q2_2025", "Q3_2025", "Q4_2025", "FY_2025"] },
    },
    execute: async (p) => {
      const data: Record<string, Record<string, string>> = {
        revenue: { Q1_2025: "$22.1B", Q2_2025: "$23.3B", Q3_2025: "$24.0B", Q4_2025: "$25.4B", FY_2025: "$94.8B" },
        ebitda: { Q1_2025: "$3.2B", Q2_2025: "$3.5B", Q3_2025: "$3.7B", Q4_2025: "$4.2B", FY_2025: "$14.6B" },
        net_income: { Q1_2025: "$1.8B", Q2_2025: "$2.0B", Q3_2025: "$2.1B", Q4_2025: "$2.5B", FY_2025: "$8.4B" },
        fcf: { Q1_2025: "$1.1B", Q2_2025: "$1.4B", Q3_2025: "$1.6B", Q4_2025: "$2.1B", FY_2025: "$6.2B" },
        cash: { Q1_2025: "$38.2B", Q2_2025: "$39.5B", Q3_2025: "$41.8B", Q4_2025: "$44.1B", FY_2025: "$44.1B" },
      }
      const metric = String(p.metric || "")
      const period = String(p.period || "")
      return data[metric]?.[period] || `No data for ${metric}/${period}`
    },
  },
  {
    name: "calculate_ratio",
    description: "Calculate a financial ratio",
    schema: {
      ratio: { type: "string", required: true, enum: ["ebitda_margin", "net_margin", "fcf_yield", "debt_to_ebitda", "current_ratio"] },
      period: { type: "string", required: true, enum: ["Q1_2025", "Q2_2025", "Q3_2025", "Q4_2025", "FY_2025"] },
    },
    execute: async (p) => {
      const ratios: Record<string, Record<string, string>> = {
        ebitda_margin: { Q1_2025: "14.5%", Q2_2025: "15.0%", Q3_2025: "15.4%", Q4_2025: "16.5%", FY_2025: "15.4%" },
        net_margin: { Q1_2025: "8.1%", Q2_2025: "8.6%", Q3_2025: "8.8%", Q4_2025: "9.8%", FY_2025: "8.9%" },
        fcf_yield: { Q1_2025: "1.2%", Q2_2025: "1.5%", Q3_2025: "1.7%", Q4_2025: "2.2%", FY_2025: "1.7%" },
      }
      const ratio = String(p.ratio || "")
      const period = String(p.period || "")
      return ratios[ratio]?.[period] || `${ratio} for ${period}: 0.0%`
    },
  },
  {
    name: "search_peers",
    description: "Search for peer company data",
    schema: {
      sector: { type: "string", required: true, description: "Industry sector" },
      metric: { type: "string", description: "Metric to compare" },
    },
    execute: async (p) => `Found 12 peer companies in ${p.sector}. Avg EBITDA margin: 12.8%, range: 8.2%–18.5%`,
  },
]

export function findTool(name: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.name === name)
}

export async function executeTool(call: ToolCall): Promise<ToolCall> {
  const def = findTool(call.name)
  if (!def) return { ...call, status: "error", error: `Unknown tool: ${call.name}` }

  const errors = validateParams(call.params, def.schema)
  if (errors.length > 0) return { ...call, status: "error", error: errors.join("; ") }

  try {
    const result = await def.execute(call.params)
    return { ...call, status: "done", result }
  } catch (err) {
    return { ...call, status: "error", error: (err as Error).message }
  }
}

export async function executeToolCalls(calls: ToolCall[]): Promise<ToolCall[]> {
  return Promise.all(calls.map(executeTool))
}
