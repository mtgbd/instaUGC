"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Grid3X3,
  Image,
  MoreHorizontal,
  Sparkles,
  Video
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ContentDrawer } from "@/components/shared/ContentDrawer"

interface LibraryClientProps {
  generations: any[]
}

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "carousel", label: "Carousel" },
  { id: "hook_demo", label: "Hook+Demo" },
  { id: "static_post", label: "Static" }
] as const

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "ready", label: "Ready" },
  { id: "failed", label: "Failed" }
] as const

export function LibraryClient({ generations }: LibraryClientProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [selectedGeneration, setSelectedGeneration] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredGenerations = useMemo(() => {
    let items = [...generations]

    if (typeFilter !== "all") {
      items = items.filter((item) => item.type === typeFilter)
    }

    if (statusFilter !== "all") {
      items = items.filter((item) => {
        if (statusFilter === "draft") {
          return item.status === "pending" || item.status === "generating"
        }
        return item.status === statusFilter
      })
    }

    items.sort((a, b) => {
      const aTime = new Date(a.created_at ?? 0).getTime()
      const bTime = new Date(b.created_at ?? 0).getTime()
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime
    })

    return items
  }, [generations, sortOrder, statusFilter, typeFilter])

  const totalCount = filteredGenerations.length
  const hasMaxInitial = generations.length === 24

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

  const getStatusClasses = (status: string | null | undefined) => {
    if (status === "ready") {
      return "bg-green-100 text-green-700"
    }
    if (status === "generating") {
      return "bg-blue-100 text-blue-700"
    }
    if (status === "failed") {
      return "bg-red-100 text-red-700"
    }
    return "bg-gray-100 text-gray-600"
  }

  const getStatusLabel = (status: string | null | undefined) => {
    if (!status) return "Pending"
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const typeIconFor = (type: string | null | undefined) => {
    if (type === "carousel") return Grid3X3
    if (type === "hook_demo") return Video
    if (type === "static_post") return Image
    return Grid3X3
  }

  const handleLoadMore = () => {
    toast.info("Load more coming soon")
  }

  const hasActiveFilters =
    typeFilter !== "all" || statusFilter !== "all"

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setTypeFilter(filter.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                typeFilter === filter.id
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                statusFilter === filter.id
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Select
            value={sortOrder}
            onValueChange={(value) =>
              setSortOrder(value as "newest" | "oldest")
            }
          >
            <SelectTrigger className="h-8 min-w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">
            {totalCount} {totalCount === 1 ? "piece" : "pieces"}
          </span>
        </div>
      </div>

      {filteredGenerations.length === 0 ? (
        <div className="py-16 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-gray-200" aria-hidden />
          <p className="mt-4 text-base font-medium text-gray-500">
            No content found
          </p>
          {hasActiveFilters ? (
            <p className="mt-1 text-sm text-gray-400">
              Try changing your filters
            </p>
          ) : (
            <Link
              href="/dashboard/generate"
              className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-700"
            >
              Generate your first content &rarr;
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredGenerations.map((item: any) => {
              const TypeIcon = typeIconFor(item.type)
              const hashtags = item.hashtags ?? []
              return (
                <div
                  key={item.id}
                  className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-indigo-300 hover:shadow-sm"
                  onClick={() => {
                    setSelectedGeneration(item)
                    setDrawerOpen(true)
                  }}
                >
                  <div className="relative h-40 bg-gray-50">
                    <div className="flex h-full flex-col items-center justify-center gap-1">
                      <TypeIcon
                        className="h-8 w-8 text-gray-300"
                        aria-hidden
                      />
                      <span className="text-xs font-medium text-gray-500">
                        {item.type === "carousel"
                          ? "Carousel"
                          : item.type === "hook_demo"
                          ? "Hook + Demo"
                          : item.type === "static_post"
                          ? "Static Post"
                          : formatTypeLabel(item.type)}
                      </span>
                    </div>
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClasses(
                        item.status
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium capitalize text-gray-900">
                      {formatTypeLabel(item.type)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {item.caption || "No caption"}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(item.created_at)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {hashtags.length} {hashtags.length === 1 ? "tag" : "tags"}
                      </span>
                      <button
                        type="button"
                        className="text-lg leading-none text-gray-400 hover:text-gray-600"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {hasMaxInitial && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      <ContentDrawer
        generation={selectedGeneration}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

