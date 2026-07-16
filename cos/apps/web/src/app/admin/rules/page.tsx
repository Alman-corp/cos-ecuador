"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

interface Rule {
  id: string
  name: string
  description: string | null
  category: string
  enabled: boolean
  version: number
  createdAt: string
}

export default function RulesDashboard() {
  const { data: rules, isLoading } = useQuery<Rule[]>({
    queryKey: ["admin-rules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rules")
      return res.json()
    },
    refetchInterval: 30000,
  })

  const { data: summary } = useQuery({
    queryKey: ["admin-rules-summary"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rules/analytics?days=30")
      return res.json()
    },
  })

  if (isLoading) return <div className="p-8 text-gray-500">Loading rules...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Rule Engine</h1>
        <Link
          href="/admin/rules/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          New Rule
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 font-medium">Total Rules</p>
          <p className="text-3xl font-bold mt-1">{summary?.totalRules ?? rules?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 font-medium">Triggered (30d)</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{summary?.triggeredToday ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 font-medium">Avg Trigger Rate</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {summary?.avgTriggerRate?.toFixed(1) ?? 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 font-medium">Avg Duration</p>
          <p className="text-3xl font-bold mt-1">{summary?.avgDuration?.toFixed(0) ?? 0}ms</p>
        </div>
      </div>

      {/* Rules table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">All Rules</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Version</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rules?.map((rule) => (
              <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/rules/${rule.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                    {rule.name}
                  </Link>
                  {rule.description && (
                    <p className="text-sm text-gray-500 truncate max-w-xs">{rule.description}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                    {rule.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">v{rule.version}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rule.enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {new Date(rule.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/rules/${rule.id}`}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
