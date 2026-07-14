"use client"

import Link from "next/link"

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-950 p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-800">
        <svg className="h-7 w-7 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-surface-50">Página no encontrada</h1>
      <p className="text-surface-400 text-sm">La página que buscas no existe o ha sido movida.</p>
      <Link href="/dashboard" className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors">
        Volver al Dashboard
      </Link>
    </div>
  )
}
