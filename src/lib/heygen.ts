const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY!
const HEYGEN_BASE_URL = 'https://api.heygen.com'

export interface HeyGenVideoStatus {
  video_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  video_url?: string
  thumbnail_url?: string
}

export async function createHeyGenVideo({
  script,
  avatarId,
  voiceId,
  duration,
}: {
  script: string
  avatarId: string
  voiceId: string
  duration: number
}): Promise<{ video_id: string } | null> {
  try {
    const response = await fetch(`${HEYGEN_BASE_URL}/v2/video/generate`, {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: avatarId,
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: script,
              voice_id: voiceId,
            },
            background: {
              type: 'color',
              value: '#ffffff',
            },
          },
        ],
        dimension: { width: 1080, height: 1920 },
        aspect_ratio: null,
      }),
    })
    const data = await response.json()
    if (data.error) return null
    return { video_id: data.data?.video_id }
  } catch {
    return null
  }
}

export async function getHeyGenVideoStatus(
  videoId: string
): Promise<HeyGenVideoStatus | null> {
  try {
    const response = await fetch(
      `${HEYGEN_BASE_URL}/v1/video_status.get?video_id=${videoId}`,
      {
        headers: { 'X-Api-Key': HEYGEN_API_KEY },
      }
    )
    const data = await response.json()
    return {
      video_id: videoId,
      status: data.data?.status ?? 'pending',
      video_url: data.data?.video_url,
      thumbnail_url: data.data?.thumbnail_url,
    }
  } catch {
    return null
  }
}

export async function listHeyGenAvatars() {
  try {
    const response = await fetch(`${HEYGEN_BASE_URL}/v2/avatars`, {
      headers: { 'X-Api-Key': HEYGEN_API_KEY },
    })
    const data = await response.json()
    return data.data?.avatars ?? []
  } catch {
    return []
  }
}

export const DEFAULT_AVATARS = {
  female: {
    avatar_id: 'Anna_public_3_20240108',
    voice_id: '1bd001e7e50f421d891986aad5158bc8',
    name: 'Anna',
  },
  male: {
    avatar_id: 'josh_lite3_20230714',
    voice_id: '2d5b0e6cf36f460aa7fc47e3eee4ba54',
    name: 'Josh',
  },
}

