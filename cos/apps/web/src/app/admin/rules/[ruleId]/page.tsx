"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

interface Rule {
  id: string
  name: string
  description: string | null
  category: string
  condition: string
  then: Record<string, unknown>
  enabled: boolean
  version: number
  metadata: Record<string, unknown> | null
  createdAt: string
}

export default function RuleEditorPage({ params }: { params: { ruleId: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isNew = params.ruleId === "new"

  const { data: rule, isLoading } = useQuery<Rule>({
    queryKey: ["admin-rule", params.ruleId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/rules/${params.ruleId}`)
      if (!res.ok) throw new Error("Not found")
      return res.json()
    },
    enabled: !isNew,
  })

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("risk")
  const [condition, setCondition] = useState("")
  const [thenJson, setThenJson] = useState('{\n  "action": "alert",\n  "severity": "warning",\n  "message": ""\n}')
  const [enabled, setEnabled] = useState(true)

  const isDirty = isNew ? !!name : name !== (rule?.name ?? "")

  // Sync state when rule loads
  if (rule && !name && !isNew) {
    setName(rule.name)
    setDescription(rule.description ?? "")
    setCategory(rule.category)
    setCondition(rule.condition)
    setThenJson(JSON.stringify(rule.then, null, 2))
    setEnabled(rule.enabled)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const then = JSON.parse(thenJson)
      const method = isNew ? "POST" : "PATCH"
      const url = isNew ? "/api/admin/rules" : `/api/admin/rules/${params.ruleId}`
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category, condition, then, enabled, changeNotes: `Updated via admin` }),
      })
      if (!res.ok) throw new Error("Save failed")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-rules"] })
      if (isNew) {
        router.push(`/admin/rules/${data.id}`)
      }
    },
  })

  if (isLoading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/rules" className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to rules
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {isNew ? "New Rule" : rule?.name}
          </h1>
        </div>
        <div className="flex gap-3 items-center">
          {!isNew && (
            <>
              <Link
                href={`/admin/rules/${params.ruleId}/versions`}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Versions (v{rule?.version})
              </Link>
              <Link
                href={`/admin/rules/${params.ruleId}/sandbox`}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Sandbox
              </Link>
            </>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Name & Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. High Debt Risk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What does this rule detect?"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="risk">Risk</option>
                <option value="opportunity">Opportunity</option>
                <option value="maturity">Maturity</option>
                <option value="recommendation">Recommendation</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Enabled</span>
              </label>
            </div>
          </div>
        </div>

        {/* Condition */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Condition</h2>
          <p className="text-sm text-gray-500">
            Write a condition using dot-path syntax. Example:{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">financials.ratios.debtToEquity &gt; 2.5</code>
          </p>
          <textarea
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="financials.ratios.debtToEquity > 2.5 and financials.cashflow.operating < financials.balanceSheet.liabilities.shortTerm"
          />
        </div>

        {/* Then (action) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Action (JSON)</h2>
          <p className="text-sm text-gray-500">
            Define the action when this rule matches. Must be valid JSON.
          </p>
          <textarea
            value={thenJson}
            onChange={(e) => setThenJson(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(() => {
            try {
              JSON.parse(thenJson)
              return null
            } catch {
              return <p className="text-xs text-red-500">Invalid JSON</p>
            }
          })()}
        </div>
      </div>
    </div>
  )
}
