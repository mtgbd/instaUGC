import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import { checkAndDeductCredits } from '@/lib/credits'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { product_id, slide_count = 5, hook_style = 'listicle' } = body

  if (!product_id) {
    return NextResponse.json(
      { error: 'product_id is required' },
      { status: 400 }
    )
  }

  const {
    data: product,
    error: productError,
  } = await supabase
    .from('products')
    .select('*')
    .eq('id', product_id)
    .eq('user_id', user.id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const {
    data: generation,
    error: genError,
  } = await supabase
    .from('content_generations')
    .insert({
      user_id: user.id,
      product_id,
      type: 'carousel',
      status: 'generating',
      credits_used: 1,
    })
    .select()
    .single()

  if (genError || !generation) {
    return NextResponse.json(
      { error: 'Failed to create generation' },
      { status: 500 }
    )
  }

  const hasCredits = await checkAndDeductCredits(
    user.id,
    1,
    'generated_carousel',
    generation.id
  )

  if (!hasCredits) {
    await supabase
      .from('content_generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)

    return NextResponse.json(
      { error: 'insufficient_credits' },
      { status: 402 }
    )
  }

  try {
    const variants: any[] = []

    for (let i = 0; i < 5; i++) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert Instagram carousel creator for DTC brands.
Your content feels authentic and valuable, never like an ad.
Always output valid JSON only — no markdown, no explanation.`,
          },
          {
            role: 'user',
            content: `Create an Instagram carousel for this product:
Name: ${product.name}
Description: ${product.description ?? 'N/A'}
Price: ${product.price ?? 'N/A'}
Key benefits: ${(product.usp ?? []).join(', ') || 'N/A'}
Niche: ${product.niche ?? 'general'}
Tone: ${product.tone ?? 'casual'}
Hook style: ${hook_style}
Number of slides: ${slide_count}
Variant: ${i + 1} of 5 (make each variant unique with a different angle)

Return this exact JSON structure:
{
  "slides": [
    {
      "slide_number": 1,
      "heading": "hook slide heading here",
      "subtext": "supporting text here",
      "image_prompt": "DALL-E image generation prompt for this slide"
    }
  ],
  "caption": "Instagram caption 150-220 chars",
  "hashtags": ["hashtag1", "hashtag2"]
}

Rules:
- First slide is the hook (attention-grabbing, stops the scroll)
- Middle slides deliver value (tips, benefits, steps)
- Last slide is a soft CTA
- Caption must be under 220 characters
- Include exactly 20 hashtags
- image_prompt should describe a clean lifestyle/product photo`,
          },
        ],
      })

      const content = completion.choices[0].message.content
      if (content) {
        variants.push(JSON.parse(content))
      }
    }

    await supabase
      .from('content_generations')
      .update({
        status: 'ready',
        output: { variants },
        caption: variants[0]?.caption ?? '',
        hashtags: variants[0]?.hashtags ?? [],
      })
      .eq('id', generation.id)

    return NextResponse.json({
      success: true,
      generation_id: generation.id,
      variants,
      status: 'ready',
    })
  } catch (error) {
    console.error('Carousel generation error:', error)

    await supabase
      .from('content_generations')
      .update({ status: 'failed' })
      .eq('id', generation.id)

    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    )
  }
}

