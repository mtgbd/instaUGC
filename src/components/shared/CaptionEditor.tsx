"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw, Copy, Check } from "lucide-react"

interface CaptionEditorProps {
  caption: string
  hashtags: string[]
  onCaptionChange: (caption: string) => void
  onHashtagsChange: (hashtags: string[]) => void
  onRegenerate?: () => void
  isRegenerating?: boolean
}

export function CaptionEditor({
  caption,
  hashtags,
  onCaptionChange,
  onHashtagsChange,
  onRegenerate,
  isRegenerating = false
}: CaptionEditorProps) {
  const [localCaption, setLocalCaption] = useState(caption)
  const [newTag, setNewTag] = useState("")
  const [copied, setCopied] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalCaption(caption)
  }, [caption])

  const debouncedCaptionChange = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        onCaptionChange(value)
      }, 800)
    },
    [onCaptionChange]
  )

  const handleCaptionChange = (value: string) => {
    setLocalCaption(value)
    debouncedCaptionChange(value)
  }

  const handleRemoveHashtag = (index: number) => {
    const next = hashtags.filter((_, i) => i !== index)
    onHashtagsChange(next)
  }

  const handleAddHashtag = () => {
    const trimmed = newTag.trim().replace(/^#/, "")
    if (!trimmed) return
    if (hashtags.length >= 30) return
    if (hashtags.includes(trimmed)) {
      setNewTag("")
      return
    }
    onHashtagsChange([...hashtags, trimmed])
    setNewTag("")
  }

  const handleHashtagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleAddHashtag()
    }
  }

  const handleCopyAll = async () => {
    const tags = hashtags.map((tag) => `#${tag}`).join(" ")
    const text = `${localCaption || ""}${tags ? `\n${tags}` : ""}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard errors
    }
  }

  const length = localCaption.length
  let counterClass = "text-xs text-gray-400"
  let counterSuffix = "/ 2200"
  if (length >= 1800 && length <= 2100) {
    counterClass = "text-xs text-amber-500"
    counterSuffix = "/ 2200 — getting long"
  } else if (length > 2100) {
    counterClass = "text-xs text-red-500"
    counterSuffix = "/ 2200 — too long"
  }

  return (
    <div>
      {/* Caption textarea */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Caption
        </label>
        <textarea
          rows={4}
          className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="Your caption will appear here..."
          value={localCaption}
          onChange={(event) => handleCaptionChange(event.target.value)}
        />
        <p className={`mt-1 text-right ${counterClass}`}>
          {length} {counterSuffix}
        </p>
      </div>

      {/* Hashtags */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Hashtags
          </label>
          <span className="text-xs text-gray-400">
            ({hashtags.length} tags)
          </span>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveHashtag(index)}
                className="ml-1 cursor-pointer font-bold text-indigo-400 hover:text-indigo-600"
                aria-label={`Remove hashtag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(event) => setNewTag(event.target.value)}
            onKeyDown={handleHashtagKeyDown}
            placeholder="Add hashtag..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddHashtag}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRegenerate?.()}
          disabled={isRegenerating}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isRegenerating ? "animate-spin text-indigo-600" : ""
            }`}
            aria-hidden
          />
          {isRegenerating ? "Regenerating..." : "Regenerate caption"}
        </button>

        <button
          type="button"
          onClick={handleCopyAll}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" aria-hidden />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              Copy all
            </>
          )}
        </button>
      </div>
    </div>
  )
}

