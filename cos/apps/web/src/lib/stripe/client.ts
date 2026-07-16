import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const PRICES = {
  STARTER: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  GROWTH: process.env.STRIPE_PRICE_GROWTH || 'price_growth',
  FIRM: process.env.STRIPE_PRICE_FIRM || 'price_firm',
  DD_SINGLE: process.env.STRIPE_PRICE_DD_SINGLE || 'price_dd_single',
} as const

export const CREDITS_BY_PRICE: Record<string, number> = {
  [PRICES.STARTER]: 3,
  [PRICES.GROWTH]: 15,
  [PRICES.FIRM]: 999,
  [PRICES.DD_SINGLE]: 1,
}
