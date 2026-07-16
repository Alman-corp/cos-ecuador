export default function ClienteLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        <p className="text-sm text-surface-400">Cargando portal...</p>
      </div>
    </div>
  )
}
