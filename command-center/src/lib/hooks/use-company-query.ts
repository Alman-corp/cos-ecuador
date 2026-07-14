import { useQuery } from "@tanstack/react-query"
import { getCompanyProfile } from "@/lib/db/queries"

export function useCompanyQuery() {
  return useQuery({
    queryKey: ["company", "profile"],
    queryFn: () => getCompanyProfile(),
    staleTime: 60_000,
  })
}
