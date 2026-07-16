"use client"

export default function ClienteError({ reset }: { reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center">
          <span className="text-2xl text-rose-500">!</span>
        </div>
        <p className="text-sm text-surface-400">Error al cargar el portal</p>
        <button onClick={reset} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
          Reintentar
        </button>
      </div>
    </div>
  )
}
