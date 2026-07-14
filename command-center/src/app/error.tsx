"use client"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-950 p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <svg className="h-7 w-7 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-surface-50">Algo salió mal</h1>
      <p className="text-surface-400 text-sm max-w-md text-center">{error.message || "Ocurrió un error inesperado. Intenta de nuevo."}</p>
      <button onClick={reset} className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors">
        Intentar de nuevo
      </button>
    </div>
  )
}
