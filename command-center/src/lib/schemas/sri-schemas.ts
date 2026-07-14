import { z } from "zod"
import { PROVINCIAS } from "@/lib/sri/lookups"

export const ProvinciaSchema = z.object({
  codigo: z.string().length(2),
  nombre: z.string(),
})

export const RetencionSRISchema = z.object({
  codigo: z.string().length(3),
  concepto: z.string(),
  porcentaje: z.number().min(0).max(100),
  tipo: z.enum(["bienes", "servicios", "arriendo"]),
})

export const ICEProductoSchema = z.object({
  codigo: z.string().length(2),
  producto: z.string(),
  categoria: z.string(),
  tasaAdValorem: z.number().min(0).max(1000),
  tasaEspecifica: z.number().min(0),
})

export const CalendarioSriSchema = z.object({
  novenoDigito: z.number().int().min(0).max(9),
  fechaPagoIva: z.number().int().min(1).max(31),
  fechaPagoRetenciones: z.number().int().min(1).max(31),
})

export const ObligacionSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  formulario: z.string(),
  fechaVencimiento: z.date(),
  periodo: z.string(),
  diasRestantes: z.number().int().min(0),
})

export const ProvinciaCodigoSchema = z
  .string()
  .length(2)
  .refine((val) => PROVINCIAS.some((p) => p.codigo === val), {
    message: "Código de provincia inválido. Debe ser 01-24",
  })

export type ProvinciaType = z.infer<typeof ProvinciaSchema>
export type RetencionSRIType = z.infer<typeof RetencionSRISchema>
export type ICEProductoType = z.infer<typeof ICEProductoSchema>
export type CalendarioSriType = z.infer<typeof CalendarioSriSchema>
export type ObligacionType = z.infer<typeof ObligacionSchema>
