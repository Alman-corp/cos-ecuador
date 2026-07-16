"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-danger/30 bg-danger/5 p-12">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-danger">Error del dashboard</h2>
        <p className="mt-1 text-sm text-surface-400">{error.message}</p>
        <button onClick={reset} className="mt-4 text-sm text-accent-400 underline">
          Reintentar
        </button>
      </div>
    </div>
  )
}
