export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 animate-pulse rounded bg-surface-700" />

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-surface-700" />
            <div className="mt-3 h-7 w-24 animate-pulse rounded bg-surface-700" />
          </div>
        ))}
      </div>

      <div className="h-72 animate-pulse rounded-xl bg-surface-800/50" />
    </div>
  )
}
