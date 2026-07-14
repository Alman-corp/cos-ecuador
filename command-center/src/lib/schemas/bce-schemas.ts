import { z } from "zod"

export const TasaInteresSchema = z.object({
  activa: z.number().min(0).max(1),
  pasiva: z.number().min(0).max(1),
  fecha: z.string(),
  fuente: z.string(),
})

export const RiesgoPaisSchema = z.object({
  valor: z.number().min(0),
  fecha: z.string(),
  fuente: z.string(),
})

export const TipoCambioSchema = z.object({
  usd: z.number().positive(),
  referencia: z.string(),
  fecha: z.string(),
})

export type TasaInteresType = z.infer<typeof TasaInteresSchema>
export type RiesgoPaisType = z.infer<typeof RiesgoPaisSchema>
export type TipoCambioType = z.infer<typeof TipoCambioSchema>
