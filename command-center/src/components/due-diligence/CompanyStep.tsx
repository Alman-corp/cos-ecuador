"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const companySchema = z.object({
  name: z.string().min(1, "El nombre de la empresa es obligatorio"),
  country: z.string().min(1, "Selecciona un país"),
  industry: z.string().min(1, "Selecciona una industria"),
})

type DDData = z.infer<typeof companySchema>

export function CompanyStep({
  data,
  setData,
  onNext,
}: {
  data: Partial<DDData>
  setData: (d: Partial<DDData>) => void
  onNext: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DDData>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: data.name || "", country: data.country || "EC", industry: data.industry || "" },
    mode: "onChange",
  })

  const recentClients = [
    { name: "ACME Manufacturing", industry: "Manufactura", lastDD: "hace 2 meses" },
    { name: "TechNova Solutions", industry: "Tecnología", lastDD: "hace 5 meses" },
    { name: "Grupo Bimbo SAB", industry: "Alimentos", lastDD: "hace 1 mes" },
  ]

  function onSubmit(values: DDData) {
    setData(values)
    onNext()
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-surface-50 mb-2">
            ¿Qué empresa vamos a analizar?
          </h1>
          <p className="text-surface-400">
            Empecemos con lo básico. Puedes escribir los datos manualmente o
            importar un cliente existente.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Nombre legal" error={errors.name?.message} htmlFor="company-name">
            <Input
              id="company-name"
              {...register("name")}
              placeholder="ACME Manufacturing S.A."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="País" error={errors.country?.message} htmlFor="company-country">
              <select
                id="company-country"
                {...register("country")}
                className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2.5 text-sm text-surface-100 outline-none focus:border-accent-500 transition-colors"
              >
                <option value="EC">Ecuador</option>
                <option value="CO">Colombia</option>
                <option value="MX">México</option>
                <option value="PE">Perú</option>
                <option value="CL">Chile</option>
              </select>
            </FormField>
            <FormField label="Industria" error={errors.industry?.message} htmlFor="company-industry">
              <select
                id="company-industry"
                {...register("industry")}
                className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2.5 text-sm text-surface-100 outline-none focus:border-accent-500 transition-colors"
              >
                <option value="">Seleccionar...</option>
                <option value="manufacturing">Manufactura</option>
                <option value="technology">Tecnología</option>
                <option value="retail">Retail</option>
                <option value="services">Servicios</option>
                <option value="food">Alimentos</option>
              </select>
            </FormField>
          </div>

          <Button
            type="submit"
            disabled={!isValid}
            className="w-full"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-surface-800 bg-surface-900/30 p-6">
        <h3 className="text-sm font-medium text-surface-200 mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-surface-400" />
          Clientes recientes
        </h3>
        <div className="space-y-2">
          {recentClients.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setData({ name: c.name, industry: c.industry.toLowerCase() })
                onNext()
              }}
              className="w-full flex items-center justify-between rounded-lg p-3 text-left hover:bg-surface-800 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-surface-200">{c.name}</p>
                <p className="text-xs text-surface-500">
                  {c.industry} · {c.lastDD}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-surface-600" />
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-surface-800">
          <p className="text-[10px] font-mono font-medium text-surface-500 uppercase tracking-wider mb-2">
            Atajos
          </p>
          <div className="space-y-1 text-xs text-surface-500">
            <p>
              <kbd className="rounded bg-surface-800 px-1 py-0.5 font-mono text-surface-400">
                ⌘K
              </kbd>{" "}
              · Abrir comandos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string
  error?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[10px] font-mono font-medium uppercase tracking-wider text-surface-500 mb-2"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
