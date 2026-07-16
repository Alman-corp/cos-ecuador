import { z, ZodSchema, ZodError } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeRequestBody } from '@/lib/security/sanitize'

export function withValidation<T extends ZodSchema>(
  schema: T,
  handler: (
    req: NextRequest,
    validatedData: z.infer<T>,
    context?: any
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      let rawData: unknown

      if (req.method === 'GET' || req.method === 'DELETE') {
        rawData = Object.fromEntries(req.nextUrl.searchParams)
      } else {
        rawData = await req.json()
      }

      const sanitized = sanitizeRequestBody(rawData)
      const validatedData = schema.parse(sanitized)

      return await handler(req, validatedData, context)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            issues: error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          },
          { status: 400 }
        )
      }

      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        )
      }

      console.error('[API Error]', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

export function validateQuery<T extends ZodSchema>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  return schema.parse(Object.fromEntries(searchParams))
}

export function validateParams<T extends ZodSchema>(
  schema: T,
  params: Record<string, string>
): z.infer<T> {
  return schema.parse(params)
}
