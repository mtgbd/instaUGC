"use client"

import {
  LayoutDashboard,
  Sparkles,
  Grid3X3,
  CalendarDays,
  BarChart2,
  Settings,
  CreditCard,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const CREDITS_MAX = 30

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/generate", label: "Generate", icon: Sparkles },
  { href: "/dashboard/library", label: "Library", icon: Grid3X3 },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard }
]

interface ProfileData {
  credits_remaining: number | null
  full_name: string | null
  plan: string | null
}

function getInitials(fullName: string | null): string {
  if (!fullName || !fullName.trim()) return "U"
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return fullName.slice(0, 2).toUpperCase()
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("profiles")
        .select("credits_remaining, full_name, plan")
        .eq("id", user.id)
        .single()
      if (data) {
        setProfile({
          credits_remaining: data.credits_remaining ?? 0,
          full_name: data.full_name ?? null,
          plan: data.plan ?? null
        })
      } else {
        setProfile({
          credits_remaining: 0,
          full_name: user.email?.split("@")[0] ?? "User",
          plan: "free"
        })
      }
    }
    fetchProfile()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/signin")
  }

  const credits = profile?.credits_remaining ?? 0
  const creditsPercent = Math.min(100, (credits / CREDITS_MAX) * 100)

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-gray-200 bg-white md:flex"
      aria-label="Dashboard navigation"
    >
      {/* Logo */}
      <div className="p-6">
        <p className="text-xl font-bold text-indigo-600">InstaUGC</p>
        <p className="mt-0.5 text-xs text-gray-400">AI Content for Instagram</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3" aria-label="Main">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex w-full flex-row items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Credits */}
      <div className="mx-3 mb-3 rounded-lg bg-gray-50 p-3">
        <p className="text-xs text-gray-500">Credits remaining</p>
        <p className="text-lg font-bold text-gray-900">{credits}</p>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-valuenow={credits}
          aria-valuemin={0}
          aria-valuemax={CREDITS_MAX}
        >
          <div
            className="h-full rounded-full bg-indigo-500 transition-[width]"
            style={{ width: `${creditsPercent}%` }}
          />
        </div>
      </div>

      {/* User */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex flex-row items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600"
            aria-hidden
          >
            {getInitials(profile?.full_name ?? null)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {profile?.full_name || "User"}
            </p>
            <span className="inline-block capitalize">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                {profile?.plan || "Free"}
              </span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  )
}
