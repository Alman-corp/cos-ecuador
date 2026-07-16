import { useQuery } from '@tanstack/react-query'

export function useDashboardKPIs(companyId: string) {
  return useQuery({
    queryKey: ['dashboard-kpis', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${companyId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    enabled: !!companyId,
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}
