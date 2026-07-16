import { useQuery, useMutation } from "@tanstack/react-query"

export function useFiscalCalendar(ninthDigit?: number, filters?: { from?: string; to?: string; status?: string }) {
  return useQuery({
    queryKey: ["fiscal-calendar", ninthDigit, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (ninthDigit !== undefined) params.set("ninthDigit", String(ninthDigit))
      if (filters?.from) params.set("from", filters.from)
      if (filters?.to) params.set("to", filters.to)
      if (filters?.status) params.set("status", filters.status)

      const res = await fetch(`/api/fiscal-calendar?${params}`)
      if (!res.ok) throw new Error("Error cargando calendario fiscal")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

export interface IvaSimulatorInput {
  ingresos0: number
  ingresos12: number
  ingresos15: number
  ivaCompras: number
  retencionesRecibidas: number
}

export interface IvaSimulatorResult {
  ivaCobrado12: number
  ivaCobrado15: number
  ivaVentas: number
  ivaCompras: number
  retencionesRecibidas: number
  ivaNeto: number
  saldoAPagar: number
  saldoAFavor: number
  detalles: {
    totalIngresos: number
    baseGravable: number
    porcentajeCarga: number
    ingresos0: number
    ingresos12: number
    ingresos15: number
  }
}

export function useIvaSimulator() {
  return useMutation({
    mutationFn: async (input: IvaSimulatorInput): Promise<IvaSimulatorResult> => {
      const res = await fetch("/api/iva-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("Error en simulación IVA")
      return res.json()
    },
  })
}
