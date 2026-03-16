import { createClient } from "@/lib/supabase/server"
import { GeneratePage } from "./components/GeneratePage"

export default async function GenerateServerPage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: products = [] } = await supabase
    .from("products")
    .select("id, name, images, niche, tone")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("credits_remaining, ai_credits_remaining")
    .eq("id", user.id)
    .maybeSingle()

  const profile = profileRow ?? {
    credits_remaining: 0,
    ai_credits_remaining: 0
  }

  return <GeneratePage products={products ?? []} profile={profile} />
}

