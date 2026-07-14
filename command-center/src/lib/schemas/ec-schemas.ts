import { z } from "zod"
import { validateCedula, validateRuc } from "@/lib/validators/ec"

export const CedulaSchema = z
  .string()
  .length(10)
  .regex(/^\d{10}$/)
  .refine(validateCedula, "Cédula inválida")

export const RucSchema = z
  .string()
  .length(13)
  .regex(/^\d{13}$/)
  .refine(validateRuc, "RUC inválido")

export const PhoneSchema = z
  .string()
  .regex(/^\+593\d{8,9}$/, "Teléfono inválido")
