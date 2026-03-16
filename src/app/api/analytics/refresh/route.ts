import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('id, ig_post_id, ig_account_id')
    .eq('user_id', user.id)
    .eq('status', 'published')
    .not('ig_post_id', 'is', null)

  if (!posts || posts.length === 0) {
    return NextResponse.json({ message: 'No published posts to refresh', updated: 0 })
  }

  const { data: igAccount } = await supabase
    .from('instagram_accounts')
    .select('access_token, ig_user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!igAccount) {
    return NextResponse.json({ message: 'No Instagram account connected', updated: 0 })
  }

  let updated = 0
  let failed = 0

  for (const post of posts) {
    try {
      await new Promise(resolve => setTimeout(resolve, 50))

      const fields = 'like_count,comments_count,reach,saved,impressions'
      const url = `https://graph.instagram.com/${post.ig_post_id}?fields=${fields}&access_token=${igAccount.access_token}`
      const response = await fetch(url)

      if (!response.ok) {
        failed++
        continue
      }

      const analytics = await response.json()

      await supabase.from('post_analytics').upsert({
        post_id: post.id,
        views: analytics.reach ?? analytics.impressions ?? 0,
        likes: analytics.like_count ?? 0,
        saves: analytics.saved ?? 0,
        comments: analytics.comments_count ?? 0,
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'post_id' })

      updated++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ updated, failed, total: posts.length })
}

