"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const INITIAL_FORM_DATA = {
  name: "",
  description: "",
  price: "",
  url: "",
  images: [] as string[],
  usp: [] as string[]
}

export interface ProductData {
  name: string
  description: string
  price: string
  url: string
  images: string[]
  usp: string[]
}

interface StepTwoProps {
  onComplete: (product: ProductData) => void
  onBack: () => void
}

type ViewMode = "url" | "edit"

const MAX_USP = 5
const MAX_IMAGES_DISPLAY = 4
const THUMB_SIZE = 60

export function StepTwo({ onComplete, onBack }: StepTwoProps) {
  const [view, setView] = useState<ViewMode>("url")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState("")
  const [formData, setFormData] = useState<ProductData>(INITIAL_FORM_DATA)
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)

  const switchToManualForm = useCallback(() => {
    setError(null)
    setFormData({ ...INITIAL_FORM_DATA })
    setView("edit")
  }, [])

  const handleFetchProduct = async () => {
    const trimmed = urlInput.trim()
    if (!trimmed) {
      setError("Please enter a product URL")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed })
      })
      const data = await res.json()
      if (data.success === true) {
        setFormData({
          name: data.name ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
          url: trimmed,
          images: Array.isArray(data.images) ? data.images.slice(0, 6) : [],
          usp: Array.isArray(data.usp) ? data.usp.slice(0, MAX_USP) : []
        })
        setPrimaryImageIndex(0)
        setView("edit")
      } else {
        switchToManualForm()
      }
    } catch {
      switchToManualForm()
    } finally {
      setLoading(false)
    }
  }

  const updateField = useCallback(
    (field: keyof ProductData, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const updateUspAt = useCallback((index: number, value: string) => {
    setFormData((prev) => {
      const next = [...prev.usp]
      next[index] = value
      return { ...prev, usp: next }
    })
  }, [])

  const removeUsp = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      usp: prev.usp.filter((_, i) => i !== index)
    }))
  }, [])

  const addUsp = useCallback(() => {
    setFormData((prev) => {
      if (prev.usp.length >= MAX_USP) return prev
      return { ...prev, usp: [...prev.usp, ""] }
    })
  }, [])

  const handleSave = useCallback(() => {
    const name = formData.name.trim()
    if (!name) {
      setError("Product name is required")
      return
    }
    setError(null)
    const images =
      formData.images.length > 0 && primaryImageIndex < formData.images.length
        ? [
            formData.images[primaryImageIndex],
            ...formData.images.filter((_, i) => i !== primaryImageIndex)
          ]
        : formData.images
    onComplete({
      name,
      description: formData.description.trim(),
      price: formData.price.trim(),
      url: formData.url.trim(),
      images,
      usp: formData.usp.map((s) => s.trim()).filter(Boolean)
    })
  }, [formData, primaryImageIndex, onComplete])

  if (view === "url") {
    return (
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900">
          Add your first product
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Paste your product URL and we&apos;ll fetch the details automatically
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label
              htmlFor="product-url"
              className="sr-only"
            >
              Product URL
            </label>
            <Input
              id="product-url"
              type="url"
              placeholder="https://yourstore.com/products/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetchProduct()}
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? "url-error" : undefined}
              className="w-full"
            />
            {error && (
              <p
                id="url-error"
                className="mt-1.5 text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
          <Button
            type="button"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={handleFetchProduct}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden
                />
                Fetching details...
              </span>
            ) : (
              "Fetch product details"
            )}
          </Button>
          <p className="text-center text-sm text-gray-500">
            Or{" "}
            <button
              type="button"
              onClick={switchToManualForm}
              className="text-gray-600 underline underline-offset-2 hover:text-gray-800"
              aria-label="Add product manually without scraping"
            >
              add manually
            </button>
          </p>
        </div>
      </div>
    )
  }

  const displayImages = formData.images.slice(0, MAX_IMAGES_DISPLAY)

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Edit product details
      </h3>

      <div className="space-y-2">
        <label
          htmlFor="product-name"
          className="block text-sm font-medium text-gray-700"
        >
          Product name <span className="text-red-500">*</span>
        </label>
        <Input
          id="product-name"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Product name"
          aria-required
          aria-invalid={!!error}
        />
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="product-description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <Textarea
          id="product-description"
          rows={3}
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Product description"
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="product-price"
          className="block text-sm font-medium text-gray-700"
        >
          Price
        </label>
        <Input
          id="product-price"
          type="text"
          value={formData.price}
          onChange={(e) => updateField("price", e.target.value)}
          placeholder="e.g. $29.99"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="product-url-edit"
          className="block text-sm font-medium text-gray-700"
        >
          Product URL
        </label>
        <Input
          id="product-url-edit"
          type="url"
          value={formData.url}
          onChange={(e) => updateField("url", e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">Images</span>
        {displayImages.length === 0 ? (
          <p className="text-sm text-gray-500">No images found</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {displayImages.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                onClick={() => setPrimaryImageIndex(index)}
                className={cn(
                  "inline-flex shrink-0 overflow-hidden rounded-lg border-2 bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                  primaryImageIndex === index
                    ? "border-indigo-600 ring-2 ring-indigo-600/30"
                    : "border-gray-200 hover:border-gray-300"
                )}
                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                aria-pressed={primaryImageIndex === index}
                aria-label={`Select image ${index + 1} as primary`}
              >
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  width={THUMB_SIZE}
                  height={THUMB_SIZE}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-700">
          USPs / Benefits
        </span>
        <ul className="space-y-2">
          {formData.usp.map((value, index) => (
            <li key={index} className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => updateUspAt(index, e.target.value)}
                placeholder={`Benefit ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeUsp(index)}
                aria-label={`Remove benefit ${index + 1}`}
                className="shrink-0"
              >
                <span className="text-base leading-none" aria-hidden>×</span>
              </Button>
            </li>
          ))}
        </ul>
        {formData.usp.length < MAX_USP && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addUsp}
            className="mt-1"
          >
            Add benefit
          </Button>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          aria-label="Go back to previous step"
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          onClick={handleSave}
          aria-label="Save product and continue"
        >
          Save and continue
        </Button>
      </div>
    </div>
  )
}
