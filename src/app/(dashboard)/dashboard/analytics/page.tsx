import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  BarChart2,
  Bookmark,
  Eye,
  Grid3X3,
  Heart,
  Image,
  Send,
  Sparkles,
  Video
} from "lucide-react"
import { RefreshButton } from "./components/RefreshButton"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { count: totalPublished = 0 } = await supabase
    .from("scheduled_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "published")

  const { data: analyticsRows = [] } = await supabase
    .from("post_analytics")
    .select("views, saves, likes, scheduled_posts!inner(user_id)")
    .eq("scheduled_posts.user_id", user.id)

  const totalViews =
    analyticsRows?.reduce(
      (sum: number, row: any) => sum + (row.views ?? 0),
      0
    ) ?? 0
  const totalSaves =
    analyticsRows?.reduce(
      (sum: number, row: any) => sum + (row.saves ?? 0),
      0
    ) ?? 0
  const totalLikes =
    analyticsRows?.reduce(
      (sum: number, row: any) => sum + (row.likes ?? 0),
      0
    ) ?? 0

  const { data: publishedPostsData } = await supabase
    .from("scheduled_posts")
    .select(
      "id, caption, type, published_at, post_analytics(views, likes, saves)"
    )
    .eq("user_id", user.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20)

  const publishedPosts = publishedPostsData ?? []

  const { data: genRows = [] } = await supabase
    .from("content_generations")
    .select("type")
    .eq("user_id", user.id)
    .eq("status", "ready")

  const generationsByType = genRows.reduce(
    (acc: Record<string, number>, row: any) => {
      if (!row.type) return acc
      acc[row.type] = (acc[row.type] ?? 0) + 1
      return acc
    },
    {}
  )

  const bestTypeEntry = Object.entries(generationsByType).sort(
    (a, b) => b[1] - a[1]
  )[0] as [string, number] | undefined

  const mapBestFormatName = (type: string) => {
    if (type === "carousel") return "Carousel posts"
    if (type === "hook_demo") return "Hook+Demo videos"
    if (type === "static_post") return "Static posts"
    return "Content"
  }

  const formatTypeLabel = (type: string | null | undefined) => {
    if (!type) return "Content"
    return type.replace("_", " ")
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) return ""
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const typeIconFor = (type: string | null | undefined) => {
    if (type === "carousel") return Grid3X3
    if (type === "hook_demo") return Video
    if (type === "static_post") return Image
    return Grid3X3
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <RefreshButton />
      </div>

      {/* Section 1 — Metrics */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Posts published */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Posts published</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalPublished.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-400">all time</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2">
              <Send className="h-5 w-5 text-indigo-500" aria-hidden />
            </div>
          </div>
        </div>

        {/* Total views */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total views</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalViews.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-400">across all posts</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2">
              <Eye className="h-5 w-5 text-indigo-500" aria-hidden />
            </div>
          </div>
        </div>

        {/* Total saves */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total saves</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalSaves.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-400">high intent signal</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2">
              <Bookmark className="h-5 w-5 text-indigo-500" aria-hidden />
            </div>
          </div>
        </div>

        {/* Total likes */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total likes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalLikes.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-400">engagement</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2">
              <Heart className="h-5 w-5 text-indigo-500" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — Best format insight */}
      <section className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-indigo-600" aria-hidden />
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Your best format
            </p>
            {bestTypeEntry ? (
              <>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {mapBestFormatName(bestTypeEntry[0])} get the most
                  engagement
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  You have generated {bestTypeEntry[1]}{" "}
                  {formatTypeLabel(bestTypeEntry[0])} posts so far. Keep
                  creating more!
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-600">
                Generate and publish content to see insights here.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Section 3 — Published posts table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Published posts
          </h2>
          <span className="text-sm text-gray-400">
            {totalPublished.toLocaleString()} total
          </span>
        </div>

        {publishedPosts.length > 0 ? (
          <div className="w-full text-sm">
            <div className="bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_80px_70px_70px] items-center gap-3">
                <span>Post</span>
                <span>Type</span>
                <span>Published</span>
                <span className="text-right">Views</span>
                <span className="text-right">Likes</span>
                <span className="text-right">Saves</span>
              </div>
            </div>
            {publishedPosts.map((post: any) => {
              const TypeIcon = typeIconFor(post.type)
              const stats = post.post_analytics?.[0] ?? {}
              const views = stats.views ?? 0
              const likes = stats.likes ?? 0
              const saves = stats.saves ?? 0
              return (
                <div
                  key={post.id}
                  className="border-t border-gray-100 px-4 py-3 hover:bg-gray-50"
                >
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_80px_70px_70px] items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <TypeIcon
                          className="h-4 w-4 text-gray-400"
                          aria-hidden
                        />
                      </div>
                      <p className="max-w-xs truncate text-sm text-gray-900">
                        {post.caption || "No caption"}
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                      {formatTypeLabel(post.type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(post.published_at)}
                    </span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {views.toLocaleString()}
                    </span>
                    <span className="text-right text-sm text-gray-600">
                      {likes.toLocaleString()}
                    </span>
                    <span className="text-right text-sm text-gray-600">
                      {saves.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <BarChart2
              className="mx-auto h-10 w-10 text-gray-200"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-gray-500">
              No published posts yet
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Publish content to see analytics here
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

