"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface StepOneProps {
  onComplete: () => void
  connected?: boolean
  username?: string
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

export function StepOne({ onComplete, connected = false, username }: StepOneProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      console.log("Instagram OAuth would trigger here")
      alert(
        "Meta app setup required — we will connect this in Task 51. Click Skip for now to continue."
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (connected && username) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-green-200 bg-green-50/50 px-6 py-10 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl font-bold text-white"
          aria-hidden
        >
          ✓
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Instagram connected
        </h3>
        <p className="mt-1 text-sm font-medium text-green-600">
          Connected as @{username}
        </p>
        <Button
          type="button"
          className="mt-6"
          onClick={onComplete}
          aria-label="Continue to next step"
        >
          Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white"
        aria-hidden
      >
        <CameraIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        Connect your Instagram account
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        Connect your Instagram Business or Creator account to start publishing
        content
      </p>
      <Button
        type="button"
        className="mt-6 w-full bg-[#4F46E5] hover:bg-[#4338CA]"
        onClick={handleConnect}
        disabled={isLoading}
        aria-busy={isLoading}
        aria-label="Connect Instagram Business Account"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden
            />
            Connecting...
          </span>
        ) : (
          "Connect Instagram Business Account"
        )}
      </Button>
      <p className="mt-3 text-xs text-gray-500">
        You&apos;ll be redirected to Facebook to authorize access
      </p>
      <button
        type="button"
        onClick={onComplete}
        className="mt-4 text-sm text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
        aria-label="Skip connecting Instagram for now"
      >
        Skip for now
      </button>
    </div>
  )
}
