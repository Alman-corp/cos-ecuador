"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"password" | "magic-link">("password")
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [message, setMessage] = useState("")
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    if (mode === "magic-link") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) {
        setStatus("error")
        setMessage(error.message)
      } else {
        setStatus("success")
        setMessage("Revisa tu bandeja de entrada para el enlace mágico.")
      }
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setStatus("error")
      setMessage(error.message)
    } else {
      window.location.href = "/dashboard"
    }
  }

  function handleDevLogin() {
    window.location.href = "/api/dev-login"
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4">
      <Card className="w-full max-w-sm bg-surface-950/50">
        <CardContent className="pt-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600/10 ring-1 ring-accent-500/20">
              <svg
                className="h-7 w-7 text-accent-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-50">
              Command Center
            </h1>
            <p className="mt-1 text-sm text-surface-400">
              Accede a tu infraestructura de inteligencia financiera
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-surface-300"
              >
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@empresa.ec"
              />
            </div>

            {mode === "password" && (
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-surface-300"
                >
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            {message && (
              <p
                className={`text-sm ${
                  status === "success" ? "text-success" : "text-danger"
                }`}
              >
                {message}
              </p>
            )}

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full"
            >
              {status === "loading"
                ? "Procesando…"
                : mode === "magic-link"
                ? "Enviar enlace mágico"
                : "Iniciar sesión"}
            </Button>
          </form>

          {process.env.NODE_ENV !== "production" && (
            <div className="mt-4 border-t border-surface-800 pt-4">
              <Button
                onClick={handleDevLogin}
                variant="outline"
                className="w-full border-dashed border-accent-500/30 text-accent-400 hover:bg-accent-500/10"
              >
                Acceso sin Supabase (modo dev)
              </Button>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-surface-500">
            {mode === "password" ? (
              <button
                type="button"
                onClick={() => setMode("magic-link")}
                className="underline hover:text-surface-300"
              >
                Prefiero usar un enlace mágico
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("password")}
                className="underline hover:text-surface-300"
              >
                Usar contraseña
              </button>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
