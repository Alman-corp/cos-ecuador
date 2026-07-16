import { stripe } from "./client"

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder"

export { stripe }
export const WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET

export const PRICES = {
  starter: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "price_starter_monthly", name: "Starter" },
  professional: { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly", name: "Professional" },
  enterprise: { monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "price_enterprise_monthly", name: "Enterprise" },
} as const

export type PriceTier = keyof typeof PRICES
