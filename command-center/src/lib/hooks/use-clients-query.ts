import { useQuery } from "@tanstack/react-query"
import { getRecentTransactions } from "@/lib/db/queries"

export function useClientsQuery(limit = 50) {
  return useQuery({
    queryKey: ["clients", "transactions", limit],
    queryFn: () => getRecentTransactions(limit),
    staleTime: 30_000,
  })
}
