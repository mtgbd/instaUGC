"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  BarChart2,
  Grid3X3,
  Image,
  Sparkles,
  Video
} from "lucide-react"

type Product = {
  id: string
  name: string
  images: string[] | null
  niche: string | null
  tone: string | null
}

type ProfileSummary = {
  credits_remaining: number | null
  ai_credits_remaining: number | null
}

interface GeneratePageProps {
  products: Product[]
  profile: ProfileSummary | null
}

const CAROUSEL_COST = 1
const HOOK_DEMO_COST = 3
const STATIC_POST_COST = 1

export default function GeneratePage({ products, profile }: GeneratePageProps) {
  const [selectedProductIndex, setSelectedProductIndex] = useState(0)
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const [contentType, setContentType] = useState<"carousel" | "hook_demo" | "static_post">("carousel")
  const [slideCount, setSlideCount] = useState(5)
  const [hookStyle, setHookStyle] = useState("listicle")
  const [avatarGender, setAvatarGender] = useState<"male" | "female">("female")
  const [videoLength, setVideoLength] = useState<15 | 30 | 60>(30)
  const [hookTone, setHookTone] = useState("excited")
  const [imageStyle, setImageStyle] = useState("lifestyle")
  const [captionLength, setCaptionLength] = useState<"short" | "medium" | "long">("medium")
  const [generating, setGenerating] = useState(false)
  const [variants, setVariants] = useState<any[]>([])
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  const credits = profile?.credits_remaining ?? 0

  const selectedProduct = products[selectedProductIndex] ?? null

  const generationCost = useMemo(() => {
    if (contentType === "hook_demo") return HOOK_DEMO_COST
    if (contentType === "static_post") return STATIC_POST_COST
    return CAROUSEL_COST
  }, [contentType])

  const insufficientCredits = credits < generationCost

  const statusMessages = [
    "Writing your content script...",
    "Generating visuals...",
    "Creating your caption...",
    "Almost ready...",
    "Polishing the final touches..."
  ]

  useEffect(() => {
    if (!generating) return
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [generating])

  const handleGenerate = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product first")
      return
    }

    if (contentType !== "carousel") {
      toast.info(
        "Hook+Demo and Static Post coming soon! Try Carousel for now."
      )
      return
    }

    if (insufficientCredits) {
      toast.error("Insufficient credits. Upgrade your plan.")
      return
    }

    setGenerating(true)
    setVariants([])
    setSelectedVariant(null)
    setGenerationId(null)
    setMessageIndex(0)

    try {
      const response = await fetch("/api/generate/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          slide_count: slideCount,
          hook_style: hookStyle
        })
      })

      const data = await response.json()

      if (response.status === 402) {
        toast.error("Not enough credits. Please upgrade your plan.")
        return
      }

      if (!response.ok || !data.success) {
        toast.error(data.error ?? "Generation failed. Please try again.")
        return
      }

      setVariants(data.variants)
      setGenerationId(data.generation_id)
      toast.success("5 variants generated successfully!")
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const currentMessage = statusMessages[messageIndex % statusMessages.length]

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left panel */}
      <div className="flex-shrink-0 lg:w-96">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {/* Product selector */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Product</p>
            {products.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                No products yet. Complete onboarding to add your first product.
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-left"
                  onClick={() => setProductPickerOpen((open) => !open)}
                >
                  {selectedProduct?.images?.[0] ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-gray-200" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {selectedProduct?.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {selectedProduct?.niche || "General"} •{" "}
                      {selectedProduct?.tone || "Default tone"}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-indigo-600">
                    Change
                  </span>
                </button>
                {productPickerOpen && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                    {products.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setSelectedProductIndex(index)
                          setProductPickerOpen(false)
                        }}
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-gray-200" aria-hidden />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {product.niche || "General"} •{" "}
                            {product.tone || "Default tone"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content type tabs */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Content type
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setContentType("carousel")}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors ${
                  contentType === "carousel"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid3X3 className="h-4 w-4" aria-hidden />
                <span>Carousel</span>
                <span className="text-xs text-gray-500">1 credit</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType("hook_demo")}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors ${
                  contentType === "hook_demo"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Video className="h-4 w-4" aria-hidden />
                <span>Hook + Demo</span>
                <span className="text-xs text-gray-500">3 credits</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType("static_post")}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors ${
                  contentType === "static_post"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Image className="h-4 w-4" aria-hidden />
                <span>Static Post</span>
                <span className="text-xs text-gray-500">1 credit</span>
              </button>
            </div>
          </div>

          {/* Options panel */}
          <div className="mt-5 space-y-4">
            {contentType === "carousel" && (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Number of slides
                  </p>
                  <div className="flex gap-2">
                    {[5, 6, 7, 8].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSlideCount(count)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                          slideCount === count
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Hook style
                  </p>
                  <Select
                    value={hookStyle}
                    onValueChange={(value) => setHookStyle(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select hook style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="listicle">
                        Listicle &mdash; &quot;5 reasons why...&quot;
                      </SelectItem>
                      <SelectItem value="tips">
                        Tips &amp; Tricks
                      </SelectItem>
                      <SelectItem value="storytelling">
                        Storytelling
                      </SelectItem>
                      <SelectItem value="before_after">
                        Before &amp; After
                      </SelectItem>
                      <SelectItem value="problem_solution">
                        Problem &amp; Solution
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {contentType === "hook_demo" && (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Avatar
                  </p>
                  <div className="flex gap-2">
                    {(["male", "female"] as const).map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setAvatarGender(gender)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                          avatarGender === gender
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {gender === "male" ? "Male" : "Female"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Video length
                  </p>
                  <div className="flex gap-2">
                    {[15, 30, 60].map((length) => (
                      <button
                        key={length}
                        type="button"
                        onClick={() => setVideoLength(length as 15 | 30 | 60)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                          videoLength === length
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {length}s
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Hook tone
                  </p>
                  <Select
                    value={hookTone}
                    onValueChange={(value) => setHookTone(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excited">Excited</SelectItem>
                      <SelectItem value="conversational">
                        Conversational
                      </SelectItem>
                      <SelectItem value="authoritative">
                        Authoritative
                      </SelectItem>
                      <SelectItem value="relatable">Relatable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {contentType === "static_post" && (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Image style
                  </p>
                  <Select
                    value={imageStyle}
                    onValueChange={(value) => setImageStyle(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select image style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="product_only">
                        Product-only
                      </SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Caption length
                  </p>
                  <div className="flex gap-2">
                    {(["short", "medium", "long"] as const).map((length) => (
                      <button
                        key={length}
                        type="button"
                        onClick={() => setCaptionLength(length)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                          captionLength === length
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {length[0].toUpperCase() + length.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Generate button */}
          <div className="mt-6">
            <p className="mb-3 text-sm text-gray-500">
              You have {credits ?? 0} credits remaining
            </p>
            <Button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700"
              onClick={handleGenerate}
              disabled={
                generating || insufficientCredits || !selectedProduct
              }
              aria-busy={generating}
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Generate 5 variants
                </>
              )}
            </Button>
            {insufficientCredits && (
              <p className="mt-2 text-xs text-red-500">
                Insufficient credits. Upgrade your plan.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1">
        <div className="min-h-96 rounded-xl border border-gray-200 bg-white p-5">
          {generating ? (
            <div>
              <div className="grid grid-cols-1 gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-48 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-sm font-medium text-indigo-600">
                {currentMessage}
              </p>
            </div>
          ) : variants.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">
                Choose your favourite variant
              </p>
              <div className="grid grid-cols-1 gap-3">
                {variants.map((variant, index) => {
                  const isSelected = selectedVariant === index
                  const slideCountLabel =
                    variant.slides?.length ?? 0
                  const hookHeading =
                    variant.slides?.[0]?.heading ?? "No hook"
                  const hashtagCount =
                    variant.hashtags?.length ?? 0

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedVariant(index)}
                      className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all hover:border-indigo-300 ${
                        isSelected
                          ? "border-2 border-indigo-500"
                          : "border-gray-200"
                      } bg-white`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                          Variant {index + 1}
                        </span>
                        <span className="text-xs text-gray-400">
                          {slideCountLabel} slides
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900">
                        {hookHeading}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {variant.caption}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400">
                          {hashtagCount} hashtags
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            Selected ✓
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedVariant !== null && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    onClick={() =>
                      toast.success(
                        "Variant saved! Publishing coming soon."
                      )
                    }
                  >
                    Use this variant
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-sm"
                    onClick={handleGenerate}
                  >
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-80 items-center justify-center">
              <div className="text-center">
                <Sparkles
                  className="mx-auto h-12 w-12 text-gray-200"
                  aria-hidden
                />
                <p className="mt-4 text-base font-medium text-gray-400">
                  Your content will appear here
                </p>
                <p className="mt-2 max-w-xs text-sm text-gray-400">
                  Select options and click Generate to create your first
                  content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { GeneratePage }


