'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, CollectionWithChildren } from '@/types'
import { nanoid } from 'nanoid'

const collectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  view_mode: z.enum(['list', 'grid', 'compact', 'masonry']).optional(),
})

export async function createCollection(data: z.infer<typeof collectionSchema>): Promise<ActionResult<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const validated = collectionSchema.safeParse(data)
  if (!validated.success) return { error: validated.error.issues[0]?.message }

  const { data: collection, error } = await supabase
    .from('collections')
    .insert({ ...validated.data, user_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return { data: collection.id }
}

export async function updateCollection(id: string, data: z.infer<typeof collectionSchema>): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('collections')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase.from('bookmarks').update({ collection_id: null }).eq('collection_id', id).eq('user_id', user.id)

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function getCollections(): Promise<ActionResult<CollectionWithChildren[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) return { error: error.message }

  const tree = buildTree(data ?? [])
  return { data: tree }
}

function buildTree(collections: CollectionWithChildren[]): CollectionWithChildren[] {
  const map = new Map<string, CollectionWithChildren>()
  const roots: CollectionWithChildren[] = []

  for (const c of collections) {
    map.set(c.id, { ...c, children: [] })
  }

  for (const c of collections) {
    const node = map.get(c.id)!
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export async function makeCollectionPublic(id: string, isPublic: boolean): Promise<ActionResult<string | null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let public_slug: string | null = null
  if (isPublic) {
    const { data: existing } = await supabase.from('collections').select('public_slug').eq('id', id).single()
    public_slug = existing?.public_slug ?? nanoid(10)
  }

  const { error } = await supabase
    .from('collections')
    .update({ is_public: isPublic, public_slug: isPublic ? public_slug : null })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return { data: public_slug }
}
