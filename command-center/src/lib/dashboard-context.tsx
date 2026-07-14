"use client"

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

type Currency = "USD" | "COP" | "MXN" | "EUR"
type Scenario = "real" | "budget" | "projected"
type ViewMode = "aggregated" | "detailed"

interface DashboardFilters {
  dateFrom: string
  dateTo: string
  currency: Currency
  scenario: Scenario
  view: ViewMode
}

interface DashboardContextValue {
  filters: DashboardFilters
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void
  resetFilters: () => void
  fmt: (valueInUSD: number) => string
  currencySymbol: string
}

const DEFAULT_FILTERS: DashboardFilters = {
  dateFrom: "2025-01-01",
  dateTo: "2025-12-31",
  currency: "USD",
  scenario: "real",
  view: "aggregated",
}

const CURRENCY_RATES: Record<Currency, number> = {
  USD: 1,
  COP: 4200,
  MXN: 18.5,
  EUR: 0.92,
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  COP: "COL$",
  MXN: "MX$",
  EUR: "€",
}

function parseFiltersFromParams(params: URLSearchParams): DashboardFilters {
  return {
    dateFrom: params.get("dateFrom") ?? DEFAULT_FILTERS.dateFrom,
    dateTo: params.get("dateTo") ?? DEFAULT_FILTERS.dateTo,
    currency: (params.get("currency") as Currency) ?? DEFAULT_FILTERS.currency,
    scenario: (params.get("scenario") as Scenario) ?? DEFAULT_FILTERS.scenario,
    view: (params.get("view") as ViewMode) ?? DEFAULT_FILTERS.view,
  }
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = useMemo(() => parseFiltersFromParams(searchParams), [searchParams])

  const setFilter = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === DEFAULT_FILTERS[key]) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  const currencySymbol = CURRENCY_SYMBOLS[filters.currency]

  const fmt = useCallback(
    (valueInUSD: number): string => {
      const rate = CURRENCY_RATES[filters.currency]
      const converted = valueInUSD * rate
      if (Math.abs(converted) >= 1e12) return `${currencySymbol}${(converted / 1e12).toFixed(2)}T`
      if (Math.abs(converted) >= 1e9) return `${currencySymbol}${(converted / 1e9).toFixed(1)}B`
      if (Math.abs(converted) >= 1e6) return `${currencySymbol}${(converted / 1e6).toFixed(0)}M`
      if (Math.abs(converted) >= 1e3) return `${currencySymbol}${(converted / 1e3).toFixed(0)}K`
      return `${currencySymbol}${converted.toFixed(0)}`
    },
    [filters.currency, currencySymbol]
  )

  return (
    <DashboardContext.Provider value={{ filters, setFilter, resetFilters, fmt, currencySymbol }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
