import { useQuery } from "@tanstack/react-query"
import { getDashboardData } from "@/lib/db/queries"

export function useDashboardQuery() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardData(),
    staleTime: 30_000,
  })
}
