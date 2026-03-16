import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/signin?error=auth_failed", request.url))
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL("/signin?error=auth_failed", request.url))
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", data.user.id)
    .single()

  if (profile?.onboarding_complete === true) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.redirect(new URL("/onboarding", request.url))
}
