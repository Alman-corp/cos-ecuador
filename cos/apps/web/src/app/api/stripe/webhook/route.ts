import { NextRequest, NextResponse } from 'next/server'
import { stripe, CREDITS_BY_PRICE } from '@/lib/stripe/client'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const companyId = session.metadata?.companyId
        const credits = Number(session.metadata?.credits || 0)
        const priceKey = session.metadata?.priceKey

        if (!companyId || !credits) break

        const existingCredit = await prisma.dueDiligenceCredit.findUnique({
          where: { companyId },
        })

        if (existingCredit) {
          await prisma.dueDiligenceCredit.update({
            where: { companyId },
            data: {
              creditsLimit: { increment: credits },
              stripePriceId: priceKey || existingCredit.stripePriceId,
            },
          })
        } else {
          await prisma.dueDiligenceCredit.create({
            data: {
              companyId,
              creditsLimit: credits,
              stripePriceId: priceKey || null,
            },
          })
        }

        if (session.subscription) {
          const subscriptionId = session.subscription as string
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)

          const billingPlan = await prisma.billingPlan.findFirst({
            where: { name: { contains: priceKey?.replace('_', ' ') || '' } },
          })

          if (billingPlan) {
            await prisma.billingSubscription.upsert({
              where: { stripeId: subscriptionId },
              update: {
                status: stripeSub.status,
                currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              },
              create: {
                companyId,
                planId: billingPlan.id,
                stripeId: subscriptionId,
                status: stripeSub.status,
                currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              },
            })
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription as string
        if (!subscriptionId) break

        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
        const companyId = stripeSub.metadata?.companyId
        const credits = Number(stripeSub.metadata?.credits || 0)

        if (companyId && credits) {
          await prisma.dueDiligenceCredit.upsert({
            where: { companyId },
            update: {
              creditsLimit: { increment: credits },
              creditsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            create: {
              companyId,
              creditsLimit: credits,
              creditsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object
        await prisma.billingSubscription.update({
          where: { stripeId: deletedSub.id },
          data: { status: 'canceled' },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
