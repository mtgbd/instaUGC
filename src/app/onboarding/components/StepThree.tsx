"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ProductData } from "./StepTwo"

const NICHES = [
  { id: "fashion", label: "Fashion", emoji: "👗" },
  { id: "beauty", label: "Beauty", emoji: "💄" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "food-drink", label: "Food & Drink", emoji: "🍔" },
  { id: "tech-gadgets", label: "Tech & Gadgets", emoji: "📱" },
  { id: "home-living", label: "Home & Living", emoji: "🏠" },
  { id: "pets", label: "Pets", emoji: "🐾" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "finance", label: "Finance", emoji: "💰" },
  { id: "general", label: "General", emoji: "⭐" }
] as const

const TONES = [
  {
    id: "professional",
    label: "Professional",
    emoji: "💼",
    example: "Discover the science behind better sleep"
  },
  {
    id: "casual",
    label: "Casual",
    emoji: "😊",
    example: "Honestly this changed my morning routine"
  },
  {
    id: "fun",
    label: "Fun",
    emoji: "🎉",
    example: "Okay we need to talk about this product 👀"
  },
  {
    id: "bold",
    label: "Bold",
    emoji: "🔥",
    example: "Stop settling for less. This is the upgrade."
  },
  {
    id: "minimal",
    label: "Minimal",
    emoji: "✨",
    example: "Simple. Clean. Effective."
  }
] as const

interface StepThreeProps {
  onComplete: () => void
  onBack: () => void
  productData?: ProductData | null
}

export function StepThree({ onComplete, onBack, productData }: StepThreeProps) {
  const [niche, setNiche] = useState<string | null>(null)
  const [tone, setTone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!niche || !tone) {
      setError("Please select a niche and tone to continue")
      return
    }
    setError(null)
    setSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be signed in to continue")
        setSaving(false)
        return
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("id", user.id)

      if (profileError) {
        setError("Could not update profile. Please try again.")
        setSaving(false)
        return
      }

      if (productData?.name) {
        await supabase.from("products").insert({
          user_id: user.id,
          name: productData.name,
          description: productData.description || null,
          price: productData.price || null,
          url: productData.url || null,
          images: productData.images?.length ? productData.images : null,
          usp: productData.usp?.length ? productData.usp : null,
          niche,
          tone
        })
      } else {
        const { data: latestProduct } = await supabase
          .from("products")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestProduct?.id) {
          await supabase
            .from("products")
            .update({ niche, tone })
            .eq("id", latestProduct.id)
        }
      }

      onComplete()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }, [niche, tone, onComplete])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          What&apos;s your niche?
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          This helps us create content that resonates with your audience
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {NICHES.map((item) => {
            const isSelected = niche === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setNiche(item.id)}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                  isSelected
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                )}
                aria-pressed={isSelected}
                aria-label={`Select ${item.label}`}
              >
                <span className="text-2xl" aria-hidden>
                  {item.emoji}
                </span>
                <span className="mt-1 text-center text-sm font-medium">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          What&apos;s your brand tone?
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {TONES.map((item) => {
            const isSelected = tone === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTone(item.id)}
                className={cn(
                  "flex cursor-pointer flex-col rounded-lg border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 min-w-[140px]",
                  isSelected
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                )}
                aria-pressed={isSelected}
                aria-label={`Select ${item.label} tone`}
              >
                <span className="text-sm font-medium">
                  {item.label} {item.emoji}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {item.example}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={saving}
          aria-label="Go back to previous step"
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
          aria-label="Save and finish onboarding"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden
              />
              Saving...
            </span>
          ) : (
            "Save and finish"
          )}
        </Button>
      </div>
    </div>
  )
}
