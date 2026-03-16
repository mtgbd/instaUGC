import Stripe from 'stripe'

const stripeApiKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeApiKey
  ? new Stripe(stripeApiKey, {
      apiVersion: '2026-02-25.clover',
    })
  : (null as unknown as Stripe)

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    credits: 30,
    ai_credits: 10,
    ig_accounts: 1,
    price_id: process.env.STRIPE_PRICE_STARTER!,
    features: [
      '30 credits per month',
      '10 AI video credits',
      '1 Instagram account',
      'Carousel generation',
      'Hook+Demo videos',
      'Email support',
    ],
  },
  growth: {
    name: 'Growth',
    price: 79,
    credits: 100,
    ai_credits: 40,
    ig_accounts: 3,
    price_id: process.env.STRIPE_PRICE_GROWTH!,
    features: [
      '100 credits per month',
      '40 AI video credits',
      '3 Instagram accounts',
      'Everything in Starter',
      'Content scheduling',
      'Priority support',
    ],
  },
  scale: {
    name: 'Scale',
    price: 149,
    credits: 250,
    ai_credits: 100,
    ig_accounts: 8,
    price_id: process.env.STRIPE_PRICE_SCALE!,
    features: [
      '250 credits per month',
      '100 AI video credits',
      '8 Instagram accounts',
      'Everything in Growth',
      'Advanced analytics',
      'Priority support',
    ],
  },
  agency: {
    name: 'Agency',
    price: 299,
    credits: 999999,
    ai_credits: 200,
    ig_accounts: 999,
    price_id: process.env.STRIPE_PRICE_AGENCY!,
    features: [
      'Unlimited credits',
      '200 AI video credits',
      'Unlimited Instagram accounts',
      'Everything in Scale',
      'White-label dashboard',
      'Dedicated support',
    ],
  },
}

