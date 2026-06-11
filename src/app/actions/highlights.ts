'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Highlight } from '@/types'

const highlightSchema = z.object({
  bookmark_id: z.string().uuid(),
  text: z.string().min(1).max(5000),
  color: z.enum(['yellow', 'green', 'blue', 'pink', 'orange']).default('yellow'),
  note: z.string().max(2000).optional().nullable(),
})

export async function createHighlight(data: z.infer<typeof highlightSchema>): Promise<ActionResult<Highlight>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const validated = highlightSchema.safeParse(data)
  if (!validated.success) return { error: validated.error.issues[0]?.message }

  const { data: highlight, error } = await supabase
    .from('highlights')
    .insert({ ...validated.data, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return { data: highlight as Highlight }
}

export async function updateHighlight(id: string, data: Partial<z.infer<typeof highlightSchema>>): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('highlights')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function deleteHighlight(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('highlights').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function getHighlights(bookmarkId: string): Promise<ActionResult<Highlight[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('bookmark_id', bookmarkId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }
  return { data: (data ?? []) as Highlight[] }
}
