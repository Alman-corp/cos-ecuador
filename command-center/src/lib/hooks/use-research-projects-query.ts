import { useQuery } from "@tanstack/react-query"
import type { ResearchProject } from "@/lib/shared-types"

async function fetchResearchProjects(): Promise<ResearchProject[]> {
  const supabase = (await import("@/utils/supabase/client")).createClient()
  const { data, error } = await supabase
    .from("research_projects")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ResearchProject[]
}

export function useResearchProjectsQuery() {
  return useQuery({
    queryKey: ["research-projects"],
    queryFn: fetchResearchProjects,
    staleTime: 30_000,
  })
}

export function useResearchProjectByIdQuery(id: string) {
  return useQuery({
    queryKey: ["research-projects", id],
    queryFn: async () => {
      const supabase = (await import("@/utils/supabase/client")).createClient()
      const { data, error } = await supabase
        .from("research_projects")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw new Error(error.message)
      return data as ResearchProject | null
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}
