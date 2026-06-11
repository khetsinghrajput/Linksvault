'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeUrl, getDomain } from '@/lib/url-utils'
import type { ActionResult, BookmarkWithTags, SortMode } from '@/types'

const createSchema = z.object({
  url: z.url(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  note: z.string().max(5000).optional(),
  collection_id: z.string().uuid().optional().nullable(),
  image_url: z.string().optional().nullable(),
  favicon_url: z.string().optional().nullable(),
  site_name: z.string().optional().nullable(),
  canonical_url: z.string().optional().nullable(),
  type: z.enum(['link', 'article', 'video', 'image', 'pdf', 'file']).default('link'),
  tags: z.array(z.string()).optional(),
})

export async function createBookmark(data: z.infer<typeof createSchema>): Promise<ActionResult<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const validated = createSchema.safeParse(data)
  if (!validated.success) return { error: validated.error.issues[0]?.message }

  const { tags, url, title, description, note, collection_id, image_url, favicon_url, site_name, canonical_url, type } = validated.data
  const domain = getDomain(url)
  const normalized = normalizeUrl(url)

  const { data: bookmark, error } = await supabase
    .from('bookmarks')
    .insert({
      url,
      title,
      description: description ?? null,
      note: note ?? null,
      collection_id: collection_id ?? null,
      image_url: image_url ?? null,
      favicon_url: favicon_url ?? null,
      site_name: site_name ?? null,
      canonical_url: canonical_url ?? null,
      type: type ?? 'link',
      user_id: user.id,
      domain,
      normalized_url: normalized,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (tags?.length) {
    await upsertTags(user.id, bookmark.id, tags)
  }

  revalidatePath('/app', 'layout')
  return { data: bookmark.id }
}

async function upsertTags(userId: string, bookmarkId: string, tagNames: string[]) {
  const supabase = await createClient()

  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) continue

    const { data: tag } = await supabase
      .from('tags')
      .upsert({ user_id: userId, name: trimmed }, { onConflict: 'user_id,name' })
      .select('id')
      .single()

    if (tag) {
      await supabase
        .from('bookmark_tags')
        .upsert({ bookmark_id: bookmarkId, tag_id: tag.id }, { ignoreDuplicates: true })
    }
  }
}

export async function updateBookmark(id: string, data: Partial<z.infer<typeof createSchema>>): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { tags, ...rest } = data
  const { error } = await supabase
    .from('bookmarks')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  if (tags !== undefined) {
    await supabase.from('bookmark_tags').delete().eq('bookmark_id', id)
    if (tags.length > 0) await upsertTags(user.id, id, tags)
  }

  revalidatePath('/app', 'layout')
  return {}
}

export async function deleteBookmark(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('bookmarks')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function restoreBookmark(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('bookmarks')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function permanentDeleteBookmark(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('bookmarks')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function toggleArchive(id: string, isArchived: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('bookmarks')
    .update({ is_archived: isArchived })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function moveBookmark(id: string, collectionId: string | null): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('bookmarks')
    .update({ collection_id: collectionId })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}

export async function getBookmarks(opts: {
  filter?: 'all' | 'favorites' | 'archive' | 'trash' | 'collection'
  collectionId?: string
  tagIds?: string[]
  search?: string
  sort?: SortMode
  page?: number
  pageSize?: number
}): Promise<ActionResult<BookmarkWithTags[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { filter = 'all', collectionId, tagIds, search, sort = 'newest', page = 0, pageSize = 50 } = opts

  let query = supabase
    .from('bookmarks')
    .select('*, tags:bookmark_tags(tag:tags(*))')
    .eq('user_id', user.id)
    .range(page * pageSize, (page + 1) * pageSize - 1)

  switch (filter) {
    case 'favorites':
      query = query.eq('is_favorite', true).eq('is_deleted', false).eq('is_archived', false)
      break
    case 'archive':
      query = query.eq('is_archived', true).eq('is_deleted', false)
      break
    case 'trash':
      query = query.eq('is_deleted', true)
      break
    case 'collection':
      query = query.eq('collection_id', collectionId!).eq('is_deleted', false).eq('is_archived', false)
      break
    default:
      query = query.eq('is_deleted', false).eq('is_archived', false)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,url.ilike.%${search}%,domain.ilike.%${search}%,note.ilike.%${search}%`)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'title':
      query = query.order('title', { ascending: true })
      break
    case 'domain':
      query = query.order('domain', { ascending: true })
      break
    case 'manual':
      query = query.order('sort_order', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) return { error: error.message }

  const bookmarks = (data ?? []).map((b: Record<string, unknown>) => ({
    ...b,
    tags: ((b.tags as Array<{ tag: Record<string, unknown> }>) ?? [])
      .map((bt) => bt.tag)
      .filter(Boolean),
  })) as BookmarkWithTags[]

  return { data: bookmarks }
}

export async function bulkAction(ids: string[], action: 'delete' | 'restore' | 'archive' | 'unarchive' | 'favorite' | 'unfavorite' | 'permanent-delete'): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let error: { message: string } | null = null

  switch (action) {
    case 'delete':
      ;({ error } = await supabase.from('bookmarks').update({ is_deleted: true, deleted_at: new Date().toISOString() }).in('id', ids).eq('user_id', user.id))
      break
    case 'restore':
      ;({ error } = await supabase.from('bookmarks').update({ is_deleted: false, deleted_at: null }).in('id', ids).eq('user_id', user.id))
      break
    case 'archive':
      ;({ error } = await supabase.from('bookmarks').update({ is_archived: true }).in('id', ids).eq('user_id', user.id))
      break
    case 'unarchive':
      ;({ error } = await supabase.from('bookmarks').update({ is_archived: false }).in('id', ids).eq('user_id', user.id))
      break
    case 'favorite':
      ;({ error } = await supabase.from('bookmarks').update({ is_favorite: true }).in('id', ids).eq('user_id', user.id))
      break
    case 'unfavorite':
      ;({ error } = await supabase.from('bookmarks').update({ is_favorite: false }).in('id', ids).eq('user_id', user.id))
      break
    case 'permanent-delete':
      ;({ error } = await supabase.from('bookmarks').delete().in('id', ids).eq('user_id', user.id))
      break
  }

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return {}
}
