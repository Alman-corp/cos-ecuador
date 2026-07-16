import { z } from "zod"
import { logger } from "@/lib/logger"
import { sanitize } from "@/lib/xss"

export interface ValidationError {
  field: string
  message: string
}

type ValidateResult<T> =
  | { data: T; errors?: undefined }
  | { data?: undefined; errors: ValidationError[] }

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown, requestId?: string): ValidateResult<T> {
  const sanitized = sanitize(body)
  const result = schema.safeParse(sanitized)

  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }))
    logger.warn({ requestId, errors }, "validation failed")
    return { errors }
  }

  return { data: result.data }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): { data?: T; errors?: ValidationError[] } {
  const raw: Record<string, string> = {}
  searchParams.forEach((value, key) => { raw[key] = value })
  const sanitized = sanitize(raw)
  const result = schema.safeParse(sanitized)

  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }))
    logger.warn({ errors }, "query validation failed")
    return { errors }
  }

  return { data: result.data }
}
