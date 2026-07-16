import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICES, CREDITS_BY_PRICE } from '@/lib/stripe/client'
import { prisma } from '@/lib/db/prisma'
import { getSessionFromRequest } from '@/lib/auth/token'

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId } = await req.json()
    const priceKey = Object.entries(PRICES).find(([, v]) => v === priceId)?.[0]

    if (!priceKey) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
    }

    const credits = CREDITS_BY_PRICE[priceId]
    if (!credits) {
      return NextResponse.json({ error: 'Unknown price' }, { status: 400 })
    }

    const companyId = session.companyId
    const isSubscription = priceKey !== 'DD_SINGLE'

    let checkoutSession

    if (isSubscription) {
      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: companyId,
        customer_email: session.email,
        metadata: { companyId, credits: String(credits), priceKey },
        success_url: `${req.headers.get('origin')}/pricing?success=true`,
        cancel_url: `${req.headers.get('origin')}/pricing?canceled=true`,
      })
    } else {
      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: companyId,
        customer_email: session.email,
        metadata: { companyId, credits: String(credits), priceKey },
        success_url: `${req.headers.get('origin')}/pricing?success=true`,
        cancel_url: `${req.headers.get('origin')}/pricing?canceled=true`,
      })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
