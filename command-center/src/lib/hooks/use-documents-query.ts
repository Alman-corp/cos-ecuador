import { useQuery } from "@tanstack/react-query"
import { getDdEngagement } from "@/lib/db/queries"

export function useDocumentsQuery(engagementId: string) {
  return useQuery({
    queryKey: ["documents", engagementId],
    queryFn: () => getDdEngagement(engagementId),
    enabled: !!engagementId,
    staleTime: 30_000,
  })
}
