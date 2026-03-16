import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const PLAN_CREDITS: Record<string, { credits: number; ai_credits: number }> = {
  starter: { credits: 30, ai_credits: 10 },
  growth: { credits: 100, ai_credits: 40 },
  scale: { credits: 250, ai_credits: 100 },
  agency: { credits: 999999, ai_credits: 200 },
}

function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_GROWTH!]: 'growth',
    [process.env.STRIPE_PRICE_SCALE!]: 'scale',
    [process.env.STRIPE_PRICE_AGENCY!]: 'agency',
  }
  return priceMap[priceId] ?? 'starter'
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId = session.metadata?.user_id
      if (!userId) break

      const subscriptionId = session.subscription as string
      const subscription = (await stripe.subscriptions.retrieve(
        subscriptionId
      )) as any
      const priceId = subscription.items.data[0].price.id
      const plan = getPlanFromPriceId(priceId)
      const planCredits = PLAN_CREDITS[plan]

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscriptionId,
        plan,
        status: 'active',
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })

      await supabase
        .from('profiles')
        .update({
          plan,
          credits_remaining: planCredits.credits,
          ai_credits_remaining: planCredits.ai_credits,
        })
        .eq('id', userId)

      await supabase.from('credits_log').insert({
        user_id: userId,
        action: 'plan_upgrade',
        credits_delta: planCredits.credits,
        balance_after: planCredits.credits,
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as any
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (sub?.user_id) {
        const priceId = subscription.items.data[0].price.id
        const plan = getPlanFromPriceId(priceId)
        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: subscription.status,
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', sub.user_id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (sub?.user_id) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            credits_remaining: 0,
            ai_credits_remaining: 0,
          })
          .eq('id', sub.user_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

