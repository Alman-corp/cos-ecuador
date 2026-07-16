"use client"

import { useEffect, useState } from "react"

type ProductPackage = {
  manifest: {
    id: string; name: string; tagline: string; description: string; version: string
    status: string; icon: string; audience: string; objective: string; price: number
    agents: any[]; rules: any[]; dashboards: any[]; reports: any[]
    workflows: any[]; kpis: any[]; permissions: string[]; dependencies: string[]
    configSchema?: Record<string, any>
  }
  dna: { name: string; version: string; description: string; modules: string[] } | null
  lifecycle: string
  installed: boolean
  installedAt: string | null
  activatedAt: string | null
  configuredAt: string | null
  config: Record<string, any>
  migrationVersion: string | null
}

type Summary = {
  total: number; running: number; installed: number; disabled: number; discovered: number
  products: any[]
}

const lifecycleColor: Record<string, string> = {
  discovered: "text-surface-500 bg-surface-800/50",
  installed: "text-blue-400 bg-blue-500/10",
  activated: "text-purple-400 bg-purple-500/10",
  configured: "text-amber-400 bg-amber-500/10",
  running: "text-emerald-400 bg-emerald-500/10",
  disabled: "text-red-400 bg-red-500/10",
  uninstalled: "text-surface-600 bg-surface-800/30",
  failed: "text-red-400 bg-red-500/20",
}

export default function ProductosPage() {
  const [packages, setPackages] = useState<ProductPackage[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [configForm, setConfigForm] = useState<Record<string, any>>({})
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [configErrors, setConfigErrors] = useState<string[]>([])

  const load = () => fetch("/api/products").then((r) => r.json()).then((d) => {
    setPackages(d.packages)
    setSummary(d.summary)
  })

  useEffect(() => { load() }, [])

  const selectedPkg = packages.find((p) => p.manifest.id === selected)

  const doAction = async (action: string) => {
    if (!selected) return
    const res = await fetch(`/api/products/${selected}/lifecycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (data.error) { setActionMsg(`Error: ${data.error}`); return }
    setActionMsg(`Action '${action}' → ${data.lifecycle}`)
    load()
  }

  const saveConfig = async () => {
    if (!selected) return
    const res = await fetch(`/api/products/${selected}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configForm),
    })
    const data = await res.json()
    if (data.error) { setConfigErrors(data.errors || [data.error]); return }
    setConfigErrors([])
    setActionMsg("Configuración guardada")
    load()
  }

  const selectProduct = (id: string) => {
    setSelected(id)
    setExpandedSection(null)
    setActionMsg(null)
    setConfigErrors([])
    const pkg = packages.find((p) => p.manifest.id === id)
    if (pkg) setConfigForm({ ...pkg.config })
  }

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-100">Business Intelligence OS</h1>
            <p className="text-sm text-surface-400 mt-1">Product Platform — {summary?.running} activos, {summary?.disabled} deshabilitados, {summary?.discovered} disponibles</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">Kernel v1.0</span>
          </div>
        </div>
      </div>

      {/* Platform Status */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-2xl font-bold text-surface-100">{summary?.total || 0}</p>
          <p className="text-xs text-surface-400">Productos registrados</p>
        </div>
        <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/10 p-4">
          <p className="text-2xl font-bold text-emerald-400">{summary?.running || 0}</p>
          <p className="text-xs text-surface-400">En ejecución</p>
        </div>
        <div className="rounded-xl border border-blue-700/30 bg-blue-900/10 p-4">
          <p className="text-2xl font-bold text-blue-400">{(summary?.installed || 0) - (summary?.running || 0)}</p>
          <p className="text-xs text-surface-400">Instalados (no activos)</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-2xl font-bold text-surface-400">{summary?.disabled || 0}</p>
          <p className="text-xs text-surface-400">Deshabilitados</p>
        </div>
        <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-4">
          <p className="text-2xl font-bold text-amber-400">{summary?.discovered || 0}</p>
          <p className="text-xs text-surface-400">Disponibles</p>
        </div>
      </div>

      {actionMsg && (
        <div className="mb-4 rounded-lg border border-accent-600/30 bg-accent-600/10 px-4 py-2 text-sm text-accent-300">{actionMsg}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product List */}
        <div className="space-y-2 lg:col-span-1">
          <h2 className="text-sm font-semibold text-surface-300 mb-3">Productos instalados</h2>
          {packages.filter((p) => p.lifecycle !== "discovered").map((pkg) => (
            <button key={pkg.manifest.id} onClick={() => selectProduct(pkg.manifest.id)}
              className={`w-full rounded-xl border p-3 text-left transition-all ${
                selected === pkg.manifest.id ? "border-accent-500/50 bg-accent-600/10" : "border-surface-700/50 bg-surface-800/50 hover:border-surface-600"
              }`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-surface-200">{pkg.manifest.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${lifecycleColor[pkg.lifecycle]}`}>{pkg.lifecycle}</span>
              </div>
              <p className="text-[11px] text-surface-500">v{pkg.manifest.version} · ${pkg.manifest.price}/mes</p>
            </button>
          ))}
          <h2 className="text-sm font-semibold text-surface-300 mb-2 mt-6">Disponibles</h2>
          {packages.filter((p) => p.lifecycle === "discovered").map((pkg) => (
            <button key={pkg.manifest.id} onClick={() => selectProduct(pkg.manifest.id)}
              className={`w-full rounded-xl border p-3 text-left transition-all ${
                selected === pkg.manifest.id ? "border-accent-500/50 bg-accent-600/10" : "border-surface-700/30 border-dashed bg-surface-800/20 hover:border-surface-600"
              }`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-surface-400">{pkg.manifest.name}</p>
                <span className="rounded-full bg-surface-700/30 px-2 py-0.5 text-[10px] text-surface-500">Próximamente</span>
              </div>
              <p className="text-[11px] text-surface-500">v{pkg.manifest.version} · ${pkg.manifest.price}/mes</p>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {!selectedPkg && (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-surface-700/50 bg-surface-800/20 p-12">
              <div className="text-center">
                <p className="text-lg font-medium text-surface-500">Selecciona un producto</p>
                <p className="text-sm text-surface-600 mt-1">Cada producto es una suite de inteligencia de dominio sobre el kernel compartido</p>
              </div>
            </div>
          )}

          {selectedPkg && (
            <div className="space-y-4">
              {/* Header with Lifecycle Controls */}
              <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-surface-100">{selectedPkg.manifest.name}</h2>
                    <p className="text-sm text-surface-400 italic mt-0.5">{selectedPkg.manifest.tagline}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${lifecycleColor[selectedPkg.lifecycle]}`}>
                    {selectedPkg.lifecycle}
                  </span>
                </div>

                {/* Lifecycle Actions */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {["install", "activate", "start", "disable", "enable", "uninstall"].map((action) => {
                    const available = {
                      discovered: ["install"],
                      installed: ["activate", "uninstall"],
                      activated: ["configure", "start", "disable", "uninstall"],
                      configured: ["start", "disable", "uninstall"],
                      running: ["disable"],
                      disabled: ["enable", "uninstall"],
                      failed: ["retry", "uninstall"],
                      uninstalled: [],
                    }[selectedPkg.lifecycle] || []

                    if (!available.includes(action)) return null
                    return (
                      <button key={action} onClick={() => doAction(action)}
                        className="rounded-lg border border-surface-600/50 bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors capitalize">
                        {action === "start" ? "▶ Iniciar" : action === "install" ? "📦 Instalar" : action === "activate" ? "⚡ Activar" : action === "disable" ? "⏸ Deshabilitar" : action === "enable" ? "▶ Habilitar" : action === "uninstall" ? "🗑 Desinstalar" : action}
                      </button>
                    )
                  })}
                </div>

                <p className="text-sm text-surface-300 mb-4">{selectedPkg.manifest.description}</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div><p className="text-xs text-surface-500">Audiencia</p><p className="text-sm text-surface-200">{selectedPkg.manifest.audience}</p></div>
                  <div><p className="text-xs text-surface-500">Objetivo</p><p className="text-sm text-surface-200">{selectedPkg.manifest.objective}</p></div>
                  <div><p className="text-xs text-surface-500">Versión</p><p className="text-sm text-surface-200">{selectedPkg.manifest.version}</p></div>
                  <div><p className="text-xs text-surface-500">Precio</p><p className="text-sm font-bold text-surface-200">${selectedPkg.manifest.price}/mes</p></div>
                </div>

                {selectedPkg.manifest.dependencies.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-surface-500 mb-1">Dependencias</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPkg.manifest.dependencies.map((dep) => (
                        <span key={dep} className="rounded bg-accent-600/10 px-2 py-0.5 text-xs text-accent-400">{dep}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPkg.migrationVersion && (
                  <div className="mt-3 text-xs text-surface-500">Migración: {selectedPkg.migrationVersion}</div>
                )}
              </div>

              {/* Configuration */}
              {selectedPkg.manifest.configSchema && Object.keys(selectedPkg.manifest.configSchema).length > 0 && (
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
                  <h3 className="text-sm font-semibold text-surface-200 mb-4">Configuración</h3>
                  {configErrors.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {configErrors.map((e, i) => (
                        <p key={i} className="text-xs text-red-400">✗ {e}</p>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(selectedPkg.manifest.configSchema).map(([key, field]: [string, any]) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs font-medium text-surface-300">{field.label}</label>
                        <p className="mb-1 text-[10px] text-surface-500">{field.description}</p>
                        {field.type === "boolean" ? (
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={configForm[key] ?? field.default ?? false}
                              onChange={(e) => setConfigForm({ ...configForm, [key]: e.target.checked })}
                              className="rounded border-surface-600 bg-surface-800 text-accent-500" />
                            <span className="text-xs text-surface-400">{configForm[key] ? "Sí" : "No"}</span>
                          </div>
                        ) : field.type === "select" && field.options ? (
                          <select value={configForm[key] ?? field.default ?? ""}
                            onChange={(e) => setConfigForm({ ...configForm, [key]: e.target.value })}
                            className="w-full rounded-lg border border-surface-600/50 bg-surface-800 px-3 py-2 text-xs text-surface-200">
                            {field.options.map((o: any) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input type={field.type === "number" ? "number" : "text"}
                            value={configForm[key] ?? field.default ?? ""}
                            onChange={(e) => setConfigForm({ ...configForm, [key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                            className="w-full rounded-lg border border-surface-600/50 bg-surface-800 px-3 py-2 text-xs text-surface-200" />
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={saveConfig}
                    className="mt-4 rounded-lg bg-accent-600 px-4 py-2 text-xs font-medium text-white hover:bg-accent-500">
                    Guardar configuración
                  </button>
                </div>
              )}

              {/* Components */}
              <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
                <h3 className="text-sm font-semibold text-surface-200 mb-4">Componentes del Producto</h3>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { key: "agents", label: "Agentes de IA", count: selectedPkg.manifest.agents.length },
                    { key: "rules", label: "Reglas", count: selectedPkg.manifest.rules.length },
                    { key: "dashboards", label: "Dashboards", count: selectedPkg.manifest.dashboards.length },
                    { key: "reports", label: "Reportes", count: selectedPkg.manifest.reports.length },
                    { key: "workflows", label: "Workflows", count: selectedPkg.manifest.workflows.length },
                    { key: "kpis", label: "KPIs", count: selectedPkg.manifest.kpis.length },
                  ].map((item) => (
                    <button key={item.key} onClick={() => setExpandedSection(expandedSection === item.key ? null : item.key)}
                      className="rounded-lg bg-surface-900/50 p-3 text-left hover:bg-surface-900">
                      <p className="text-lg font-bold text-surface-100">{item.count}</p>
                      <p className="text-[10px] text-surface-400">{item.label}</p>
                    </button>
                  ))}
                </div>

                {/* Expanded detail sections (same pattern as before) */}
                {expandedSection === "agents" && (
                  <div className="mt-4 space-y-3">
                    {selectedPkg.manifest.agents.map((agent: any) => (
                      <div key={agent.name} className="rounded-lg bg-surface-900/30 p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-surface-200">{agent.name}</p>
                          <span className="rounded bg-surface-700/50 px-2 py-0.5 text-[10px] text-surface-400">{agent.model}</span>
                        </div>
                        <p className="text-xs text-surface-400 mb-2">{agent.description}</p>
                        {agent.tools.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {agent.tools.map((t: string) => (
                              <span key={t} className="rounded bg-accent-600/10 px-1.5 py-0.5 text-[10px] text-accent-400">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expandedSection === "rules" && (
                  <div className="mt-4 space-y-2">
                    {selectedPkg.manifest.rules.map((rule: any) => (
                      <div key={rule.name} className="flex items-center justify-between rounded-lg bg-surface-900/30 p-3">
                        <div>
                          <p className="text-sm text-surface-200">{rule.name}</p>
                          <p className="text-xs text-surface-400">{rule.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-surface-700/50 px-2 py-0.5 text-[10px] text-surface-400">{rule.category}</span>
                          <span className="text-xs text-surface-500">{rule.count} reglas</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expandedSection === "dashboards" && (
                  <div className="mt-4 space-y-2">
                    {selectedPkg.manifest.dashboards.map((d: any) => (
                      <div key={d.name} className="rounded-lg bg-surface-900/30 p-3">
                        <p className="text-sm text-surface-200">{d.name}</p>
                        <p className="text-xs text-surface-400">{d.description}</p>
                        <p className="text-[10px] text-accent-500 mt-1">{d.route}</p>
                      </div>
                    ))}
                  </div>
                )}

                {expandedSection === "reports" && (
                  <div className="mt-4 space-y-2">
                    {selectedPkg.manifest.reports.map((r: any) => (
                      <div key={r.name} className="flex items-center justify-between rounded-lg bg-surface-900/30 p-3">
                        <div>
                          <p className="text-sm text-surface-200">{r.name}</p>
                          <p className="text-xs text-surface-400">{r.description}</p>
                        </div>
                        <span className="rounded bg-surface-700/50 px-2 py-0.5 text-[10px] text-surface-400">{r.format}</span>
                      </div>
                    ))}
                  </div>
                )}

                {expandedSection === "workflows" && (
                  <div className="mt-4 space-y-2">
                    {selectedPkg.manifest.workflows.map((w: any) => (
                      <div key={w.name} className="flex items-center justify-between rounded-lg bg-surface-900/30 p-3">
                        <div>
                          <p className="text-sm text-surface-200">{w.name}</p>
                          <p className="text-xs text-surface-400">{w.description}</p>
                        </div>
                        <span className="text-xs text-surface-500">{w.steps} pasos</span>
                      </div>
                    ))}
                  </div>
                )}

                {expandedSection === "kpis" && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-surface-700/50">
                          <th className="pb-2 text-xs font-medium text-surface-500">KPI</th>
                          <th className="pb-2 text-xs font-medium text-surface-500">Descripción</th>
                          <th className="pb-2 text-xs font-medium text-surface-500">Fórmula</th>
                          <th className="pb-2 text-xs font-medium text-surface-500">Unidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPkg.manifest.kpis.map((kpi: any) => (
                          <tr key={kpi.name} className="border-b border-surface-800/50">
                            <td className="py-2 text-surface-200">{kpi.name}</td>
                            <td className="py-2 text-xs text-surface-400 max-w-xs">{kpi.description}</td>
                            <td className="py-2 text-xs text-surface-500 font-mono">{kpi.formula}</td>
                            <td className="py-2 text-xs text-surface-400">{kpi.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* DNA Module */}
              {selectedPkg.dna && (
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
                  <h3 className="text-sm font-semibold text-surface-200 mb-2">Módulo DNA</h3>
                  <p className="text-sm text-surface-300 mb-1">{selectedPkg.dna.name} v{selectedPkg.dna.version}</p>
                  <p className="text-xs text-surface-400 mb-3">{selectedPkg.dna.description}</p>
                  {selectedPkg.dna.modules.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedPkg.dna.modules.map((m: string) => (
                        <span key={m} className="rounded bg-surface-700/30 px-2 py-0.5 text-xs text-surface-400">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Permissions */}
              {selectedPkg.manifest.permissions.length > 0 && (
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
                  <h3 className="text-sm font-semibold text-surface-200 mb-3">Permisos</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedPkg.manifest.permissions.map((p: string) => (
                      <span key={p} className="rounded bg-surface-700/30 px-2 py-0.5 text-xs font-mono text-surface-400">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Version Timeline */}
              {selectedPkg.installedAt && (
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
                  <h3 className="text-sm font-semibold text-surface-200 mb-3">Línea de tiempo</h3>
                  <div className="space-y-2">
                    {selectedPkg.installedAt && <div className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-blue-400" /><span className="text-surface-400">Instalado: {new Date(selectedPkg.installedAt).toLocaleString()}</span></div>}
                    {selectedPkg.activatedAt && <div className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-purple-400" /><span className="text-surface-400">Activado: {new Date(selectedPkg.activatedAt).toLocaleString()}</span></div>}
                    {selectedPkg.configuredAt && <div className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="text-surface-400">Configurado: {new Date(selectedPkg.configuredAt).toLocaleString()}</span></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
