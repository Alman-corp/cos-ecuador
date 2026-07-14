import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getDocumentsHub, uploadDocumentToHub } from "@/lib/db/queries"

export function useDataHubQuery() {
  return useQuery({
    queryKey: ["data-hub"],
    queryFn: () => getDocumentsHub(),
    staleTime: 30_000,
  })
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadDocumentToHub(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] })
    },
  })
}
