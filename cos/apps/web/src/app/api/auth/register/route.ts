import { NextResponse } from "next/server"
import { commandBus, DomainError } from "@/core"
import { logger } from "@/lib/logger"
import type { RegisterCompanyCommand, RegisterCompanyResult } from "@/core/use-cases/identity/RegisterCompanyUseCase"
import { validateBody } from "@/lib/validate"
import { RegisterCompanySchema } from "@/lib/api-schemas"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { data, errors } = validateBody(RegisterCompanySchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const cmd: RegisterCompanyCommand = {
      type: "identity.registerCompany",
      name: data.name,
      taxId: data.taxId || "",
      email: data.email || "",
      phone: data.phone || "",
      firstName: data.firstName || "Admin",
      lastName: data.lastName || "",
    }
    const result = await commandBus.dispatch<RegisterCompanyCommand, RegisterCompanyResult>(cmd)

    const res = NextResponse.json(result)
    res.cookies.set("cos_company_id", result.companyId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 604800,
    })
    return res
  } catch (err: any) {
    if (err instanceof DomainError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "CONFLICT" ? 409 : 400 })
    }
    logger.error({ err: err.message }, "registration error")
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
