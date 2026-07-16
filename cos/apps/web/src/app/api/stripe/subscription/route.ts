import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe/config"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get("customerId")
    if (!customerId) {
      return NextResponse.json({ error: "customerId required" }, { status: 400 })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    })

    const sub = subscriptions.data[0]
    if (!sub) {
      return NextResponse.json({ status: "none" })
    }

    return NextResponse.json({
      id: sub.id,
      status: sub.status,
      currentPeriodStart: (sub as any).current_period_start,
      currentPeriodEnd: (sub as any).current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      priceId: sub.items.data[0]?.price.id,
      currency: sub.currency,
      amount: sub.items.data[0]?.price.unit_amount,
    })
  } catch (err: any) {
    logger.error({ err: err.message }, "stripe subscription error")
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
