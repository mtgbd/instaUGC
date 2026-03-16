import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import GeneratePage from "../../generate/components/GeneratePage"

export default async function GeneratePageWrapper() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, images, niche, tone")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining, ai_credits_remaining")
    .eq("id", user.id)
    .single()

  return (
    <GeneratePage
      products={products ?? []}
      profile={profile ?? { credits_remaining: 0, ai_credits_remaining: 0 }}
    />
  )
}

