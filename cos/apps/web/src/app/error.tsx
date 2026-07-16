"use client"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-danger">Error crítico</h1>
        <p className="mt-2 text-sm text-surface-400">
          {error.message || "Ocurrió un error inesperado."}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
