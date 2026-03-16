"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"
import { CaptionEditor } from "@/components/shared/CaptionEditor"

interface ContentDrawerProps {
  generation: any | null
  open: boolean
  onClose: () => void
}

export function ContentDrawer({
  generation,
  open,
  onClose
}: ContentDrawerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [localCaption, setLocalCaption] = useState(
    generation?.caption ?? ""
  )
  const [localHashtags, setLocalHashtags] = useState<string[]>(
    generation?.hashtags ?? []
  )
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    setLocalCaption(generation?.caption ?? "")
    setLocalHashtags(generation?.hashtags ?? [])
    setCurrentSlide(0)
  }, [generation])

  const handleRegenerate = () => {
    setIsRegenerating(true)
    toast.info("Caption regeneration coming soon")
    setTimeout(() => setIsRegenerating(false), 600)
  }

  const type = generation?.type as string | undefined
  const createdAt = generation?.created_at
    ? new Date(generation.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    : ""

  const typeLabel = type
    ? type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Content"

  const output = generation?.output ?? {}

  const slides =
    type === "carousel"
      ? output?.variants?.[0]?.slides ?? []
      : []

  const hasSlides = type === "carousel" && slides.length > 0

  const scriptData =
    type === "hook_demo" && output?.script ? output.script : null

  const videoUrl =
    type === "hook_demo" && output?.video_url ? output.video_url : null

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg"
      >
        <SheetHeader className="border-b border-gray-100 pb-3">
          <SheetTitle>{typeLabel}</SheetTitle>
          {createdAt && (
            <SheetDescription>Created {createdAt}</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 pt-3">
            {/* Section 1 — Content preview */}
            <section className="space-y-3">
              {hasSlides ? (
                <div>
                  <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSlide((prev) => Math.max(0, prev - 1))
                      }
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Prev
                    </button>
                    <span>
                      Slide {currentSlide + 1} of {slides.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSlide((prev) =>
                          Math.min(slides.length - 1, prev + 1)
                        )
                      }
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="min-h-40 rounded-xl bg-gray-50 p-5">
                    <span className="mb-2 inline-block rounded-full border bg-white px-2 py-0.5 text-xs text-gray-500">
                      Slide {slides[currentSlide]?.slide_number ??
                        currentSlide + 1}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">
                      {slides[currentSlide]?.heading ?? "Untitled slide"}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {slides[currentSlide]?.subtext ?? "No subtext provided."}
                    </p>
                  </div>
                </div>
              ) : scriptData ? (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">
                      Hook
                    </p>
                    <div className="rounded-lg bg-indigo-50 p-3 text-sm font-medium text-indigo-900">
                      {scriptData.hook ?? "No hook provided."}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">
                      Full script
                    </p>
                    <div className="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
                      {scriptData.full_script ?? "No script provided."}
                    </div>
                  </div>
                  {videoUrl && (
                    <video
                      className="mt-3 w-full rounded-xl"
                      controls
                      src={videoUrl}
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                  Preview not available
                </div>
              )}
            </section>

            {/* Section 2 — Caption + hashtags */}
            <section>
              <CaptionEditor
                caption={localCaption}
                hashtags={localHashtags}
                onCaptionChange={setLocalCaption}
                onHashtagsChange={setLocalHashtags}
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
              />
            </section>
          </div>

          {/* Section 3 — Actions */}
          <div className="border-t border-gray-100 bg-white p-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "Publishing coming soon — building this next!"
                  )
                }
                className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Publish now
              </button>
              <button
                type="button"
                onClick={() => toast.info("Scheduling coming soon!")}
                className="rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Schedule
              </button>
              <button
                type="button"
                onClick={() => toast.info("Duplicate coming soon!")}
                className="rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

