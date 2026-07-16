export default function RootLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-900">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <p className="text-sm text-surface-400">Cargando...</p>
      </div>
    </div>
  )
}
