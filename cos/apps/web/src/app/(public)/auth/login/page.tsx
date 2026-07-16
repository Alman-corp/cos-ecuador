"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "demo">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem("cos_user_id", data.userId)
      localStorage.setItem("cos_company_id", data.companyId)
      router.push("/director")
    } catch (err: any) {
      setStatus("error")
      setMessage(err.message)
    }
  }

  function enterDemo() {
    setStatus("demo")
    document.cookie = "cos_demo_mode=true; path=/; max-age=86400"
    localStorage.setItem("cos_company_id", "demo-company")
    router.push("/director")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600/10 ring-1 ring-accent-500/20">
            <svg className="h-7 w-7 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-surface-50">Command Center</h1>
          <p className="mt-1 text-sm text-surface-400">Accede a tu panel de inteligencia empresarial</p>
        </div>

        <button onClick={enterDemo} disabled={status === "demo"} className="mb-4 w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50">
          {status === "demo" ? "Entrando..." : "🚀 Entrar en Modo Demo"}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-900 px-2 text-surface-500">o con tu correo</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-surface-300">Correo electrónico</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@empresa.ec" className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500" />
          </div>
          {message && <p className="text-sm text-red-400">{message}</p>}
          <button type="submit" disabled={status === "loading"} className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-50">
            {status === "loading" ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-surface-500">
          <Link href="/auth/register" className="text-accent-400 hover:text-accent-300">Crear nueva empresa</Link>
        </p>
        <p className="mt-8 text-center text-xs text-surface-600">
          <Link href="/" className="hover:text-surface-400">&larr; Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
