import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BillingClient } from "./components/BillingClient"

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, credits_remaining")
    .eq("id", user.id)
    .maybeSingle()

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <BillingClient
      profile={profile ?? { plan: "free", credits_remaining: 0 }}
      subscription={subscription ?? null}
    />
  )
}


