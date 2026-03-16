import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import { checkAndDeductCredits } from '@/lib/credits'
import { createHeyGenVideo, DEFAULT_AVATARS } from '@/lib/heygen'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    product_id,
    avatar_gender = 'female',
    duration = 30,
    hook_tone = 'conversational',
  } = body

  if (!product_id) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  }

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', product_id)
    .eq('user_id', user.id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const { data: generation } = await supabase
    .from('content_generations')
    .insert({
      user_id: user.id,
      product_id,
      type: 'hook_demo',
      status: 'generating',
      credits_used: 3,
    })
    .select()
    .single()

  if (!generation) {
    return NextResponse.json({ error: 'Failed to create generation' }, { status: 500 })
  }

  const hasCredits = await checkAndDeductCredits(
    user.id, 3, 'generated_hook_demo', generation.id
  )
  if (!hasCredits) {
    await supabase
      .from('content_generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)
    return NextResponse.json({ error: 'insufficient_credits' }, { status: 402 })
  }

  try {
    const scriptCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You write short-form video scripts for Instagram Reels that
feel like authentic UGC creator reviews. Never sound like an ad.
Output only valid JSON.`,
        },
        {
          role: 'user',
          content: `Write a ${duration}-second Instagram Reel script for:
Product: ${product.name}
Description: ${product.description ?? 'N/A'}
Price: ${product.price ?? 'N/A'}
Benefits: ${(product.usp ?? []).join(', ') || 'N/A'}
Tone: ${hook_tone}

Structure:
- First 3 seconds: strong hook that stops the scroll (under 15 words)
- Middle: natural spoken product review covering top 3 benefits
- Last few seconds: soft CTA

Return this exact JSON:
{
  "hook": "the opening 3-second line",
  "full_script": "the complete script to be spoken (${Math.round(duration * 2.5)} words max)",
  "caption": "Instagram caption under 200 chars",
  "hashtags": ["tag1", "tag2", "tag3"]
}`,
        },
      ],
    })

    const scriptData = JSON.parse(scriptCompletion.choices[0].message.content ?? '{}')

    const avatar = DEFAULT_AVATARS[avatar_gender as 'male' | 'female']
    const heygenResult = await createHeyGenVideo({
      script: scriptData.full_script,
      avatarId: avatar.avatar_id,
      voiceId: avatar.voice_id,
      duration,
    })

    await supabase
      .from('content_generations')
      .update({
        status: heygenResult ? 'generating' : 'ready',
        output: {
          script: scriptData,
          video_id: heygenResult?.video_id ?? null,
          avatar_gender,
          duration,
        },
        caption: scriptData.caption,
        hashtags: scriptData.hashtags,
      })
      .eq('id', generation.id)

    return NextResponse.json({
      success: true,
      generation_id: generation.id,
      script: scriptData,
      video_id: heygenResult?.video_id ?? null,
      status: 'generating',
      estimated_seconds: duration === 15 ? 60 : duration === 30 ? 90 : 150,
      message: 'Script generated. Video is rendering in the background.',
    })

  } catch (error) {
    console.error('Hook+demo generation error:', error)
    await supabase
      .from('content_generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}

