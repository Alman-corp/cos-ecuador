import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSimulationParams, saveSimulationParams } from "@/lib/db/queries"
import type { SalaGuerraState } from "@/lib/shared-types"

export function useSimulationsQuery() {
  return useQuery({
    queryKey: ["simulations"],
    queryFn: () => getSimulationParams(),
    staleTime: 30_000,
  })
}

export function useSaveSimulationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: SalaGuerraState) => saveSimulationParams(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] })
    },
  })
}
