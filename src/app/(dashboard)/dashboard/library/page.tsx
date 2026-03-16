import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LibraryClient } from "./components/LibraryClient"

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: generations = [] } = await supabase
    .from("content_generations")
    .select("id, type, status, caption, hashtags, created_at, output")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24)

  return <LibraryClient generations={generations ?? []} />
}

