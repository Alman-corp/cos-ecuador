import { z } from "zod"

export const InflacionAnualSchema = z.object({
  valor: z.number().min(-100).max(100),
  periodo: z.string(),
  fuente: z.string(),
})

export const CanastaBasicaSchema = z.object({
  valor: z.number().positive(),
  ingresoFamiliar: z.number().positive(),
  canastaVital: z.number().positive(),
  periodo: z.string(),
  fuente: z.string(),
})

export const SBUSchema = z.object({
  valor: z.number().positive(),
  vigencia: z.string(),
  fuente: z.string(),
})

export type InflacionAnualType = z.infer<typeof InflacionAnualSchema>
export type CanastaBasicaType = z.infer<typeof CanastaBasicaSchema>
export type SBUType = z.infer<typeof SBUSchema>
