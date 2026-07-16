export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <p className="text-xs text-surface-500">Cargando portal consultor...</p>
      </div>
    </div>
  )
}
