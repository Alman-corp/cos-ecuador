"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"

interface Version {
  id: string
  version: number
  name: string
  description: string | null
  condition: string
  then: Record<string, unknown>
  enabled: boolean
  createdBy: string
  changeNotes: string | null
  createdAt: string
}

interface DiffResult {
  v1: Version
  v2: Version
  changed: Record<string, boolean>
}

export default function RuleVersionsPage({ params }: { params: { ruleId: string } }) {
  const queryClient = useQueryClient()
  const [diffVersion, setDiffVersion] = useState<number | null>(null)
  const [selectedV1, setSelectedV1] = useState<number | null>(null)
  const [selectedV2, setSelectedV2] = useState<number | null>(null)

  const { data: rule } = useQuery({
    queryKey: ["admin-rule", params.ruleId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/rules/${params.ruleId}`)
      return res.json()
    },
  })

  const { data: versions } = useQuery<Version[]>({
    queryKey: ["admin-rule-versions", params.ruleId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/rules/${params.ruleId}/versions`)
      return res.json()
    },
    refetchInterval: 10000,
  })

  const { data: diff } = useQuery<DiffResult>({
    queryKey: ["admin-rule-diff", params.ruleId, selectedV1, selectedV2],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/rules/${params.ruleId}/versions/diff?v1=${selectedV1}&v2=${selectedV2}`
      )
      // Fallback: calculate diff client-side if API not available
      if (!res.ok) throw new Error("API not available")
      return res.json()
    },
    enabled: selectedV1 !== null && selectedV2 !== null,
  })

  const rollbackMutation = useMutation({
    mutationFn: async (targetVersion: number) => {
      const res = await fetch(`/api/admin/rules/${params.ruleId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion }),
      })
      if (!res.ok) throw new Error("Rollback failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rule", params.ruleId] })
      queryClient.invalidateQueries({ queryKey: ["admin-rule-versions", params.ruleId] })
    },
  })

  if (diffVersion === null) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <Link href={`/admin/rules/${params.ruleId}`} className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to editor
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Version History &mdash; {rule?.name ?? "Loading..."}
          </h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium">By</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions?.map((v) => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className="font-mono text-sm font-medium">v{v.version}</span>
                    {v.version === rule?.version && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        current
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{v.changeNotes ?? "-"}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{v.createdBy}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(v.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDiffVersion(v.version)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                      {v.version !== rule?.version && (
                        <button
                          onClick={() => {
                            if (confirm(`Rollback to v${v.version}? This will create v${(rule?.version ?? 0) + 1}.`)) {
                              rollbackMutation.mutate(v.version)
                            }
                          }}
                          className="text-sm text-orange-600 hover:text-orange-800"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Show version detail
  const version = versions?.find((v) => v.version === diffVersion)
  if (!version) return null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => setDiffVersion(null)} className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to list
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">v{diffVersion} — {version.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Condition</h3>
          <pre className="text-sm font-mono bg-gray-50 p-3 rounded-lg overflow-x-auto">
            {version.condition}
          </pre>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Action (then)</h3>
          <pre className="text-sm font-mono bg-gray-50 p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(version.then, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
