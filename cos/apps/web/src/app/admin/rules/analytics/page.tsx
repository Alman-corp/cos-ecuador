"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import Link from "next/link"

export default function RulesAnalyticsPage() {
  const [days, setDays] = useState("30")

  const { data: analytics } = useQuery({
    queryKey: ["admin-analytics", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/rules/analytics?days=${days}`)
      return res.json()
    },
    refetchInterval: 60000,
  })

  const { data: topRules } = useQuery({
    queryKey: ["admin-analytics-top", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/rules/analytics/top?days=${days}`)
      return res.json()
    },
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/rules" className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to rules
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Rule Analytics</h1>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 font-medium">Total Rules</p>
          <p className="text-3xl font-bold mt-1">{analytics?.totalRules ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 font-medium">Triggered ({days}d)</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{analytics?.triggeredToday ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 font-medium">Avg Trigger Rate</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {analytics?.avgTriggerRate?.toFixed(1) ?? 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 font-medium">Avg Duration</p>
          <p className="text-3xl font-bold mt-1">{analytics?.avgDuration?.toFixed(0) ?? 0}ms</p>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trigger Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics?.dailyTrend ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top rules */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Triggered Rules</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topRules ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ruleName" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={80} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="triggerCount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rules summary table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Per-Rule Summary</h2>
          <p className="text-sm text-gray-500 mb-3">Select a rule to see detailed analytics</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {topRules?.map((r: { ruleId: string; ruleName?: string; _count: { _all: number } }, i: number) => (
              <Link
                key={r.ruleId}
                href={`/api/admin/rules/analytics/${r.ruleId}?days=${days}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-sm"
              >
                <span className="font-medium text-gray-700">{r.ruleName ?? r.ruleId.slice(0, 8)}</span>
                <span className="text-gray-500">{r._count._all} triggers</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
