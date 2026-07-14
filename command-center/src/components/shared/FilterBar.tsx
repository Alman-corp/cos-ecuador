"use client"

import { useDashboard } from "@/lib/dashboard-context"

export function FilterBar() {
  const { filters, setFilter, resetFilters } = useDashboard()

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-surface-700/50 bg-surface-800/30 px-4 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500 mr-1">
        Filtros
      </span>

      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-surface-500">Moneda</label>
        <select
          value={filters.currency}
          onChange={(e) => setFilter("currency", e.target.value as any)}
          className="rounded-md bg-surface-800 px-2 py-1 text-xs font-mono text-surface-200 border border-surface-700 outline-none focus:border-accent-500"
        >
          <option value="USD">USD $</option>
          <option value="COP">COP $</option>
          <option value="MXN">MXN $</option>
          <option value="EUR">EUR €</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-surface-500">Escenario</label>
        <select
          value={filters.scenario}
          onChange={(e) => setFilter("scenario", e.target.value as any)}
          className="rounded-md bg-surface-800 px-2 py-1 text-xs font-mono text-surface-200 border border-surface-700 outline-none focus:border-accent-500"
        >
          <option value="real">Real</option>
          <option value="budget">Presupuesto</option>
          <option value="projected">Proyectado</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-surface-500">Vista</label>
        <select
          value={filters.view}
          onChange={(e) => setFilter("view", e.target.value as any)}
          className="rounded-md bg-surface-800 px-2 py-1 text-xs font-mono text-surface-200 border border-surface-700 outline-none focus:border-accent-500"
        >
          <option value="aggregated">Agregado</option>
          <option value="detailed">Detallado</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-surface-500">Desde</label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter("dateFrom", e.target.value)}
          className="rounded-md bg-surface-800 px-2 py-1 text-xs font-mono text-surface-200 border border-surface-700 outline-none focus:border-accent-500"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[10px] text-surface-500">Hasta</label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter("dateTo", e.target.value)}
          className="rounded-md bg-surface-800 px-2 py-1 text-xs font-mono text-surface-200 border border-surface-700 outline-none focus:border-accent-500"
        />
      </div>

      <button
        onClick={resetFilters}
        className="ml-auto rounded-md bg-surface-700 px-2.5 py-1 text-[10px] font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-600 transition-colors"
      >
        Reset
      </button>
    </div>
  )
}
