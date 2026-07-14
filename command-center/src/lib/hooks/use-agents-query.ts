import { useQuery } from "@tanstack/react-query"
import { getAgents, getAgentById } from "@/lib/db/queries"

export function useAgentsQuery() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => getAgents(),
    staleTime: 30_000,
  })
}

export function useAgentByIdQuery(id: string) {
  return useQuery({
    queryKey: ["agents", id],
    queryFn: () => getAgentById(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}
