import { Skeleton } from "@/components/ui/skeleton"

export default function LandingLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-surface-900 p-8">
      <Skeleton className="h-12 w-96" />
      <Skeleton className="h-64 w-full max-w-4xl rounded-2xl" />
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
