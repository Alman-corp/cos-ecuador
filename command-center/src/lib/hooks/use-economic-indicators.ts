import { useQuery } from "@tanstack/react-query"
import { getTasaInteres, getRiesgoPais } from "@/lib/bce/lookups"
import { getInflacion, getCanastaBasica, getSBU } from "@/lib/inec/lookups"
import type { EconomicIndicators } from "@/lib/shared-types"

function fetchEconomicIndicators(): EconomicIndicators {
  const tasa = getTasaInteres()
  const riesgo = getRiesgoPais()
  const inflacion = getInflacion()
  const canasta = getCanastaBasica()
  const sbu = getSBU()
  return {
    tasaActiva: { value: tasa.activa * 100, fecha: tasa.fecha, fuente: tasa.fuente },
    tasaPasiva: { value: tasa.pasiva * 100, fecha: tasa.fecha, fuente: tasa.fuente },
    riesgoPais: { value: riesgo.valor, fecha: riesgo.fecha, fuente: riesgo.fuente },
    inflacionINPC: { value: inflacion.valor, periodo: inflacion.periodo, fuente: inflacion.fuente },
    canastaBasica: { value: canasta.valor, ingresoFamiliar: canasta.ingresoFamiliar, canastaVital: canasta.canastaVital, periodo: canasta.periodo, fuente: canasta.fuente },
    sbu: { value: sbu.valor, vigencia: sbu.vigencia, fuente: sbu.fuente },
  }
}

export function useEconomicIndicators() {
  return useQuery({
    queryKey: ["economic-indicators"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 600))
      return fetchEconomicIndicators()
    },
    staleTime: 5 * 60 * 1000,
  })
}
