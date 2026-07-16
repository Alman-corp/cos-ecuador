"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-surface-200">Algo salió mal</h2>
        <p className="mt-1 text-sm text-surface-400">{error.message}</p>
        <button onClick={reset} className="mt-4 text-sm text-accent-400 underline">
          Reintentar
        </button>
      </div>
    </div>
  )
}
