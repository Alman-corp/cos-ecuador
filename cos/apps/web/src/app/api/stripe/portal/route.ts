import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe/config"
import { validateBody } from "@/lib/validate"
import { StripePortalSchema } from "@/lib/api-schemas"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { data, errors } = validateBody(StripePortalSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const session = await stripe.billingPortal.sessions.create({
      customer: data.customerId,
      return_url: `${req.headers.get("origin")}/cliente/configuracion`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    logger.error({ err: err.message }, "stripe portal error")
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
