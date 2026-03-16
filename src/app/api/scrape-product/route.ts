import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'

const FETCH_TIMEOUT_MS = 8000
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const MAX_IMAGES = 6
const MAX_USP = 5
const USP_MIN_LEN = 10
const USP_MAX_LEN = 150

interface ScrapeBody {
  url?: string
}

function resolveUrl(href: string | undefined, baseUrl: string): string | null {
  if (!href || !href.trim()) return null
  try {
    return new URL(href, baseUrl).href
  } catch {
    return null
  }
}

function extractPrice($: cheerio.CheerioAPI): string | null {
  const ogAmount = $('meta[property="og:price:amount"]').attr('content')
  if (ogAmount != null && ogAmount.trim() !== '') {
    return ogAmount.trim()
  }

  const bodyText = $('body').text() || ''
  const pricePatterns = [
    /\$[\d,]+(?:\.\d{1,2})?/,
    /₹[\d,]+(?:\.\d{1,2})?/,
    /€[\d,]+(?:\.\d{1,2})?/,
    /£[\d,]+(?:\.\d{1,2})?/,
    /[\d,]+(?:\.\d{1,2})?\s*[$₹€£]/
  ]
  for (const pattern of pricePatterns) {
    const match = bodyText.match(pattern)
    if (match) return match[0].trim()
  }
  return null
}

function extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const ogImage = $('meta[property="og:image"]').attr('content')
  if (ogImage) {
    const resolved = resolveUrl(ogImage, baseUrl)
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved)
      out.push(resolved)
    }
  }

  $('img[src]').each((_, el) => {
    if (out.length >= MAX_IMAGES) return false
    const src = $(el).attr('src')
    if (!src) return
    const lower = src.toLowerCase()
    if (!lower.includes('product') && !lower.includes('cdn')) return
    const resolved = resolveUrl(src, baseUrl)
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved)
      out.push(resolved)
    }
  })

  return out.slice(0, MAX_IMAGES)
}

function extractUsp($: cheerio.CheerioAPI): string[] {
  const candidates: string[] = []

  $('li').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ')
    if (text.length >= USP_MIN_LEN && text.length <= USP_MAX_LEN) {
      candidates.push(text)
    }
  })

  return candidates.slice(0, MAX_USP)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let body: ScrapeBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'URL required' },
        { status: 400 }
      )
    }

    const url = body?.url
    if (url == null || typeof url !== 'string' || url.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'URL required' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let html: string
    try {
      const res = await fetch(url.trim(), {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT
        }
      })
      clearTimeout(timeoutId)
      if (!res.ok) {
        return NextResponse.json({ success: false }, { status: 200 })
      }
      html = await res.text()
    } catch {
      clearTimeout(timeoutId)
      return NextResponse.json({ success: false }, { status: 200 })
    }

    const $ = cheerio.load(html)
    const baseUrl = url.trim()

    const ogTitle = $('meta[property="og:title"]').attr('content')
    const titleTag = $('title').first().text().trim()
    const h1 = $('h1').first().text().trim()
    const name =
      (ogTitle && ogTitle.trim()) || titleTag || h1 || null

    const ogDesc = $('meta[property="og:description"]').attr('content')
    const metaDesc = $('meta[name="description"]').attr('content')
    const description =
      (ogDesc && ogDesc.trim()) || (metaDesc && metaDesc.trim()) || null

    const price = extractPrice($)
    const images = extractImages($, baseUrl)
    const usp = extractUsp($)

    return NextResponse.json({
      success: true,
      name,
      description,
      price,
      images,
      usp
    })
  } catch {
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
