"use client"

export default function LandingError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-950 p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
        <svg className="h-7 w-7 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-surface-50">Error en la página de inicio</h1>
      <p className="text-surface-400 text-sm max-w-md text-center">{error.message}</p>
      <button onClick={reset} className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors">
        Reintentar
      </button>
    </div>
  )
}
