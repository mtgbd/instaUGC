import { createClient } from '@/lib/supabase/server'

export async function checkAndDeductCredits(
  userId: string,
  amount: number,
  action: string,
  generationId?: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', userId)
    .single()

  if (!profile || profile.credits_remaining < amount) {
    return false
  }

  const newBalance = profile.credits_remaining - amount

  await supabase
    .from('profiles')
    .update({ credits_remaining: newBalance })
    .eq('id', userId)

  await supabase.from('credits_log').insert({
    user_id: userId,
    action,
    credits_delta: -amount,
    balance_after: newBalance,
    generation_id: generationId ?? null,
  })

  return true
}

