"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

interface Scenario {
  id: string
  name: string
  facts: {
    clientId: string
    financials: {
      revenue: { total: number; growth: number; recurring: number }
      expenses: { total: number; fixed: number; variable: number }
      balanceSheet: {
        assets: number
        liabilities: { total: number; shortTerm: number; longTerm: number }
        equity: number
      }
      cashflow: { operating: number; investing: number; financing: number; runway: number }
      ratios: {
        debtToEquity: number; currentRatio: number; quickRatio: number
        grossMargin: number; netMargin: number; roe: number; roa: number
      }
    }
    operational: {
      employees: number; digitalMaturity: number
      processAutomation: number; customerRetention: number
    }
    industry: {
      sector: string; benchmarkDebtRatio: number; benchmarkMargin: number
    }
  }
}

const defaultFacts: Scenario["facts"] = {
  clientId: "simulated-client",
  financials: {
    revenue: { total: 5_000_000, growth: 15, recurring: 70 },
    expenses: { total: 4_000_000, fixed: 2_500_000, variable: 1_500_000 },
    balanceSheet: {
      assets: 8_000_000,
      liabilities: { total: 5_000_000, shortTerm: 2_000_000, longTerm: 3_000_000 },
      equity: 3_000_000,
    },
    cashflow: { operating: 500_000, investing: -800_000, financing: 500_000, runway: 12 },
    ratios: { debtToEquity: 1.67, currentRatio: 1.5, quickRatio: 1.2, grossMargin: 40, netMargin: 20, roe: 16.7, roa: 12.5 },
  },
  operational: { employees: 50, digitalMaturity: 3, processAutomation: 40, customerRetention: 85 },
  industry: { sector: "manufacturing", benchmarkDebtRatio: 1.8, benchmarkMargin: 15 },
}

export default function RuleSandboxPage({ params }: { params: { ruleId: string } }) {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "1", name: "Baseline", facts: JSON.parse(JSON.stringify(defaultFacts)) },
  ])
  const [results, setResults] = useState<Record<string, unknown>>({})
  const [running, setRunning] = useState(false)

  const { data: rule } = useQuery({
    queryKey: ["admin-rule", params.ruleId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/rules/${params.ruleId}`)
      return res.json()
    },
  })

  const addScenario = () => {
    setScenarios([
      ...scenarios,
      { id: Date.now().toString(), name: `Scenario ${scenarios.length + 1}`, facts: JSON.parse(JSON.stringify(defaultFacts)) },
    ])
  }

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id))
  }

  const updateFact = (scenarioId: string, path: string, value: number) => {
    setScenarios(scenarios.map((s) => {
      if (s.id !== scenarioId) return s
      const newFacts = JSON.parse(JSON.stringify(s.facts))
      const keys = path.split(".")
      let obj: Record<string, unknown> = newFacts
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]] as Record<string, unknown>
      }
      obj[keys[keys.length - 1]] = value
      return { ...s, facts: newFacts }
    }))
  }

  const runAll = async () => {
    setRunning(true)
    try {
      const res = await fetch("/api/admin/rules/simulate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId: params.ruleId, scenarios: scenarios.map((s) => ({ id: s.id, name: s.name, facts: s.facts })) }),
      })
      const data = await res.json()
      setResults(data.results ?? {})
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/admin/rules/${params.ruleId}`} className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to editor
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Sandbox &mdash; {rule?.name ?? "Loading..."}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Test rules against synthetic scenarios before deploying
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addScenario}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            + Add Scenario
          </button>
          <button
            onClick={runAll}
            disabled={running}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {running ? "Running..." : "Run All"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {scenarios.map((scenario) => {
          const f = scenario.facts
          const result = results[scenario.id] as Record<string, unknown> | undefined
          return (
            <div key={scenario.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <input
                  value={scenario.name}
                  onChange={(e) => setScenarios(scenarios.map((s) => (s.id === scenario.id ? { ...s, name: e.target.value } : s)))}
                  className="font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                />
                {scenarios.length > 1 && (
                  <button onClick={() => removeScenario(scenario.id)} className="text-sm text-red-500 hover:text-red-700">
                    Remove
                  </button>
                )}
              </div>

              {/* Sliders for key metrics */}
              <div>
                <label className="text-sm text-gray-600">Revenue Growth: {f.financials.revenue.growth}%</label>
                <input
                  type="range"
                  min={-50}
                  max={200}
                  value={f.financials.revenue.growth}
                  onChange={(e) => updateFact(scenario.id, "financials.revenue.growth", Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Debt/Equity: {f.financials.ratios.debtToEquity.toFixed(2)}</label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={f.financials.ratios.debtToEquity}
                  onChange={(e) => updateFact(scenario.id, "financials.ratios.debtToEquity", Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Digital Maturity: {f.operational.digitalMaturity}/5</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={f.operational.digitalMaturity}
                  onChange={(e) => updateFact(scenario.id, "operational.digitalMaturity", Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Current Ratio: {f.financials.ratios.currentRatio.toFixed(2)}</label>
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={f.financials.ratios.currentRatio}
                  onChange={(e) => updateFact(scenario.id, "financials.ratios.currentRatio", Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Results */}
              {result && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Results</h4>
                  {((result as Record<string, unknown>).risks as Array<{ message: string; severity: string }> | undefined)?.map(
                    (r: { message: string; severity: string }, i: number) => (
                      <div key={i} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {r.message}
                      </div>
                    )
                  )}
                  {((result as Record<string, unknown>).opportunities as Array<{ message: string }> | undefined)?.map(
                    (o: { message: string }, i: number) => (
                      <div key={i} className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        {o.message}
                      </div>
                    )
                  )}
                  {((result as Record<string, unknown>).recommendations as Array<{ message: string }> | undefined)?.map(
                    (r: { message: string }, i: number) => (
                      <div key={i} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                        {r.message}
                      </div>
                    )
                  )}
                  {!result ||
                    (((result as Record<string, unknown>).risks as unknown[] | undefined)?.length ?? 0) === 0 &&
                      ((result as Record<string, unknown>).opportunities as unknown[] | undefined)?.length === 0 &&
                      ((result as Record<string, unknown>).recommendations as unknown[] | undefined)?.length === 0 && (
                        <p className="text-sm text-gray-400">No rules triggered for this scenario</p>
                      )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
