import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  BarChart2,
  Eye,
  FileText,
  Grid3X3,
  Image,
  Send,
  Sparkles,
  Video,
  Zap
} from "lucide-react"

const CREDITS_MAX = 30

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-gray-500">
          Your dashboard is ready, but we could not load your account.
        </p>
      </div>
    )
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, credits_remaining, plan")
    .eq("id", user.id)
    .maybeSingle()

  const fullName = profileRow?.full_name ?? user.email ?? "there"
  const firstName = fullName.split(" ")[0] || "there"
  const creditsRemaining = profileRow?.credits_remaining ?? 0
  const plan = profileRow?.plan ?? "free"

  const oneWeekAgoIso = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { count: postsThisWeekRaw } = await supabase
    .from("scheduled_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "published")
    .gte("published_at", oneWeekAgoIso)

  const postsThisWeek = postsThisWeekRaw ?? 0

  const { data: viewsRows } = await supabase
    .from("post_analytics")
    .select("views, scheduled_posts!inner(user_id)")
    .eq("scheduled_posts.user_id", user.id)

  const totalViews =
    viewsRows?.reduce((sum, row: any) => sum + (row.views ?? 0), 0) ?? 0

  const { data: recentGenerationsData } = await supabase
    .from("content_generations")
    .select("id, type, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4)

  const recentGenerations = recentGenerationsData ?? []

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const creditsPercent = Math.min(
    100,
    (creditsRemaining / CREDITS_MAX) * 100
  )

  const formatTypeLabel = (type: string | null) => {
    if (!type) return "Content"
    return type.replace("_", " ")
  }

  const renderStatusBadge = (status: string | null) => {
    if (status === "ready") {
      return (
        <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          Ready
        </span>
      )
    }
    if (status === "generating") {
      return (
        <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          Generating
        </span>
      )
    }
    if (status === "failed") {
      return (
        <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
          Failed
        </span>
      )
    }
    if (status === "pending") {
      return (
        <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          Pending
        </span>
      )
    }
    return null
  }

  const typeIconFor = (type: string | null) => {
    if (type === "carousel") return Grid3X3
    if (type === "hook_demo") return Video
    if (type === "static_post") return Image
    return FileText
  }

  return (
    <div className="space-y-8">
      {/* Section 1 — Welcome banner */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s what&apos;s happening with your content today.
        </p>
      </section>

      {/* Section 2 — Stat cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Posts this week */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">
              Posts this week
            </p>
            <Send className="h-5 w-5 text-indigo-500" aria-hidden />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {postsThisWeek.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            published in the last 7 days
          </p>
        </div>

        {/* Total views */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Total views</p>
            <Eye className="h-5 w-5 text-indigo-500" aria-hidden />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {totalViews.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            across all published posts
          </p>
        </div>

        {/* Credits remaining */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">
              Credits remaining
            </p>
            <Zap className="h-5 w-5 text-indigo-500" aria-hidden />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {creditsRemaining.toLocaleString()}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-indigo-500"
              style={{ width: `${creditsPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            of {CREDITS_MAX} credits this month
          </p>
        </div>
      </section>

      {/* Section 3 — Recent content */}
      <section className="space-y-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent content
          </h2>
          <Link
            href="/dashboard/library"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all &rarr;
          </Link>
        </div>

        {recentGenerations.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {recentGenerations.map((item: any) => {
              const TypeIcon = typeIconFor(item.type)
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="mb-3 flex h-28 w-full items-center justify-center rounded-lg bg-gray-100">
                    <TypeIcon
                      className="h-6 w-6 text-gray-400"
                      aria-hidden
                    />
                  </div>
                  <p className="text-sm font-medium capitalize text-gray-900">
                    {formatTypeLabel(item.type)}
                  </p>
                  {renderStatusBadge(item.status)}
                  <p className="mt-1 text-xs text-gray-400">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
            <Sparkles
              className="mx-auto h-10 w-10 text-gray-300"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-gray-500">
              No content yet
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Your generated content will appear here
            </p>
            <Link
              href="/dashboard/generate"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Generate your first content &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Section 4 — Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Generate content */}
          <Link
            href="/dashboard/generate"
            className="flex items-center gap-4 rounded-xl bg-indigo-600 p-4 text-white transition-colors duration-150 hover:bg-indigo-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/70">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-medium">Generate content</p>
              <p className="text-sm opacity-80">
                Create AI UGC for Instagram
              </p>
            </div>
          </Link>

          {/* View library */}
          <Link
            href="/dashboard/library"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-gray-900 transition-colors duration-150 hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
              <Grid3X3 className="h-5 w-5 text-indigo-500" aria-hidden />
            </div>
            <div>
              <p className="font-medium">View library</p>
              <p className="text-sm text-gray-500">
                Browse all your content
              </p>
            </div>
          </Link>

          {/* Check analytics */}
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-gray-900 transition-colors duration-150 hover:bg-gray-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
              <BarChart2 className="h-5 w-5 text-indigo-500" aria-hidden />
            </div>
            <div>
              <p className="font-medium">Check analytics</p>
              <p className="text-sm text-gray-500">See what&apos;s performing</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
