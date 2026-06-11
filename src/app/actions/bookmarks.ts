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

export async function importBookmarksBatch(
  items: Array<{ url: string; title: string; description?: string; image_url?: string; tags?: string[] }>
): Promise<{ imported: number; errors: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { imported: 0, errors: ['Not signed in — please log out and back in'] }

  const errors: string[] = []

  const validRows: Array<{
    insert: { url: string; title: string; description: string | null; image_url: string | null; type: string; user_id: string; domain: string | null; normalized_url: string | null }
    tags: string[]
  }> = []

  for (const item of items) {
    if (!item.url?.startsWith('http')) { errors.push(`Bad URL: ${item.url}`); continue }
    const title = (item.title?.trim() || getDomain(item.url) || 'Untitled').slice(0, 500)
    validRows.push({
      insert: {
        url: item.url,
        title,
        description: item.description?.slice(0, 2000) ?? null,
        image_url: item.image_url ?? null,
        type: 'link',
        user_id: user.id,
        domain: getDomain(item.url),
        normalized_url: normalizeUrl(item.url),
      },
      tags: item.tags ?? [],
    })
  }

  if (validRows.length === 0) return { imported: 0, errors }

  // Build tag map for the whole batch in 2 queries
  const allTagNames = [...new Set(validRows.flatMap(r => r.tags).map(t => t.toLowerCase().trim()).filter(Boolean))]
  const tagMap: Record<string, string> = {}

  if (allTagNames.length > 0) {
    const { data: existing } = await supabase.from('tags').select('id, name').eq('user_id', user.id).in('name', allTagNames)
    existing?.forEach(t => { tagMap[t.name] = t.id })
    const missing = allTagNames.filter(n => !tagMap[n])
    if (missing.length > 0) {
      const { data: created } = await supabase.from('tags').insert(missing.map(name => ({ name, user_id: user.id }))).select('id, name')
      created?.forEach(t => { tagMap[t.name] = t.id })
    }
  }

  // Bulk insert all bookmarks in one query
  const { data: inserted, error: insertError } = await supabase
    .from('bookmarks')
    .insert(validRows.map(r => r.insert))
    .select('id')

  if (insertError) {
    return { imported: 0, errors: [`Insert failed: ${insertError.message}`] }
  }

  // Bulk insert bookmark_tags in one query
  const btRecords = validRows.flatMap((row, i) => {
    const bmId = inserted?.[i]?.id
    if (!bmId) return []
    return row.tags.map(t => tagMap[t.toLowerCase().trim()]).filter(Boolean).map(tagId => ({ bookmark_id: bmId, tag_id: tagId }))
  })
  if (btRecords.length > 0) {
    await supabase.from('bookmark_tags').insert(btRecords)
  }

  revalidatePath('/app', 'layout')
  return { imported: inserted?.length ?? 0, errors }
}

export async function uploadFileBookmark(formData: FormData): Promise<ActionResult<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File | null
  if (!file || !file.name) return { error: 'No file provided' }
  if (file.size > 50 * 1024 * 1024) return { error: 'File must be under 50 MB' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const type = ext === 'pdf' ? 'pdf' : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? 'image' : 'file'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file)
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)

  const { data: bookmark, error } = await supabase
    .from('bookmarks')
    .insert({ url: publicUrl, title: file.name, type, user_id: user.id, storage_path: path, mime_type: file.type, file_size: file.size, domain: null, normalized_url: null })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/app', 'layout')
  return { data: bookmark.id }
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
