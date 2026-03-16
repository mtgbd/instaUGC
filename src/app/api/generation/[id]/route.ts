import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHeyGenVideoStatus } from '@/lib/heygen'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: generation } = await supabase
    .from('content_generations')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!generation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (
    generation.type === 'hook_demo' &&
    generation.status === 'generating' &&
    generation.output?.video_id
  ) {
    const videoStatus = await getHeyGenVideoStatus(generation.output.video_id)

    if (videoStatus?.status === 'completed' && videoStatus.video_url) {
      await supabase
        .from('content_generations')
        .update({
          status: 'ready',
          output: {
            ...generation.output,
            video_url: videoStatus.video_url,
            thumbnail_url: videoStatus.thumbnail_url,
          },
        })
        .eq('id', generation.id)

      return NextResponse.json({
        ...generation,
        status: 'ready',
        output: {
          ...generation.output,
          video_url: videoStatus.video_url,
        },
      })
    }

    if (videoStatus?.status === 'failed') {
      await supabase
        .from('content_generations')
        .update({ status: 'failed' })
        .eq('id', generation.id)
    }
  }

  return NextResponse.json(generation)
}

