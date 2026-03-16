"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

export function RefreshButton() {
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    try {
      const res = await fetch("/api/analytics/refresh", { method: "POST" })
      const data = await res.json()
      toast.success(
        `Analytics refreshed — ${data.updated ?? 0} posts updated`
      )
    } catch {
      toast.error("Failed to refresh analytics")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
    >
      <RefreshCw
        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
        aria-hidden
      />
      {loading ? "Refreshing..." : "Refresh data"}
    </button>
  )
}

