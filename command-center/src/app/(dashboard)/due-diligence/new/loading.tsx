import { Skeleton } from "@/components/ui/skeleton"

export default function NewDDLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-center gap-4 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-lg" />
        ))}
      </div>
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-12" />
      </div>
    </div>
  )
}
