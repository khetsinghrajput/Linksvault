'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Tag } from '@/types'

export async function getTags(): Promise<ActionResult<(Tag & { count: number })[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: tags, error } = await supabase
    .from('tags')
    .select('*, bookmark_tags(count)')
    .eq('user_id', user.id)
    .order('name')

  if (error) return { error: error.message }

  return {
    data: (tags ?? []).map((t: Record<string, unknown>) => ({
      ...(t as Tag),
      count: (t.bookmark_tags as Array<{ count: number }>)?.[0]?.count ?? 0,
    })),
  }
}

export async function renameTag(id: string, name: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tags')
    .update({ name: name.trim().toLowerCase() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('tags').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function mergeTags(sourceId: string, targetId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: links } = await supabase
    .from('bookmark_tags')
    .select('bookmark_id')
    .eq('tag_id', sourceId)

  for (const link of links ?? []) {
    await supabase
      .from('bookmark_tags')
      .upsert({ bookmark_id: link.bookmark_id, tag_id: targetId }, { ignoreDuplicates: true })
  }

  await supabase.from('tags').delete().eq('id', sourceId).eq('user_id', user.id)
  revalidatePath('/app', 'layout')
  return {}
}
