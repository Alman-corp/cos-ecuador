"use client"

import Link from "next/link"

export default function DDNotFound() {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 bg-surface-950 p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-800">
        <svg className="h-7 w-7 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-surface-50">Due Diligence no encontrado</h1>
      <p className="text-surface-400 text-sm">El proceso de Due Diligence que buscas no existe.</p>
      <Link href="/due-diligence/new" className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 transition-colors">
        Iniciar nuevo DD
      </Link>
    </div>
  )
}
