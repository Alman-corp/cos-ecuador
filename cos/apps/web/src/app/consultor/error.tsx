"use client"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <div className="max-w-sm text-center">
        <h2 className="text-lg font-semibold text-surface-200">Error en el portal consultor</h2>
        <p className="mt-1 text-sm text-surface-400">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500">
          Reintentar
        </button>
      </div>
    </div>
  )
}
