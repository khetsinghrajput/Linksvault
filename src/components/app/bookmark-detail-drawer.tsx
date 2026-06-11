'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Star, Archive, Trash2, Globe, Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toggleFavorite, toggleArchive, deleteBookmark, updateBookmark } from '@/app/actions/bookmarks'
import { createHighlight, deleteHighlight, getHighlights } from '@/app/actions/highlights'
import type { BookmarkWithTags, Highlight } from '@/types'

const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'] as const
const colorStyles: Record<string, string> = {
  yellow: 'bg-yellow-100 dark:bg-yellow-900/40',
  green: 'bg-green-100 dark:bg-green-900/40',
  blue: 'bg-blue-100 dark:bg-blue-900/40',
  pink: 'bg-pink-100 dark:bg-pink-900/40',
  orange: 'bg-orange-100 dark:bg-orange-900/40',
}

interface BookmarkDetailDrawerProps {
  bookmark: BookmarkWithTags | null
  onClose: () => void
}

export function BookmarkDetailDrawer({ bookmark, onClose }: BookmarkDetailDrawerProps) {
  const [note, setNote] = useState(bookmark?.note ?? '')
  const [editingNote, setEditingNote] = useState(false)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [newHighlight, setNewHighlight] = useState('')
  const [highlightColor, setHighlightColor] = useState<typeof HIGHLIGHT_COLORS[number]>('yellow')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (!bookmark) return
    setNote(bookmark.note ?? '')
    setEditingNote(false)
    getHighlights(bookmark.id).then(r => { if (r.data) setHighlights(r.data) })
  }, [bookmark?.id])

  if (!bookmark) return null

  async function handleFavorite() {
    const r = await toggleFavorite(bookmark!.id, !bookmark!.is_favorite)
    if (r.error) toast.error(r.error)
  }

  async function handleArchive() {
    const r = await toggleArchive(bookmark!.id, !bookmark!.is_archived)
    if (r.error) toast.error(r.error)
    else toast.success(bookmark!.is_archived ? 'Restored from archive' : 'Archived')
  }

  async function handleDelete() {
    const r = await deleteBookmark(bookmark!.id)
    if (r.error) toast.error(r.error)
    else { toast.success('Moved to trash'); onClose() }
  }

  async function saveNote() {
    setSavingNote(true)
    const r = await updateBookmark(bookmark!.id, { note: note.trim() || undefined })
    setSavingNote(false)
    if (r.error) toast.error(r.error)
    else { setEditingNote(false); toast.success('Note saved') }
  }

  async function addHighlight() {
    if (!newHighlight.trim()) return
    const r = await createHighlight({ bookmark_id: bookmark!.id, text: newHighlight.trim(), color: highlightColor })
    if (r.error) toast.error(r.error)
    else if (r.data) { setHighlights(h => [...h, r.data!]); setNewHighlight('') }
  }

  async function removeHighlight(id: string) {
    const r = await deleteHighlight(id)
    if (r.error) toast.error(r.error)
    else setHighlights(h => h.filter(x => x.id !== id))
  }

  return (
    <div className="flex h-full w-96 shrink-0 flex-col border-l bg-background">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <span className="text-sm font-medium">Details</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              {bookmark.favicon_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bookmark.favicon_url} alt="" width={16} height={16} className="mt-1 shrink-0 rounded" />
              )}
              <h2 className="text-base font-semibold leading-tight">{bookmark.title}</h2>
            </div>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Globe className="h-3 w-3" />
              {bookmark.domain}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {bookmark.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bookmark.image_url} alt="" className="rounded-lg w-full object-cover max-h-40" />
          )}

          {/* Actions */}
          <div className="flex gap-1">
            <Button variant={bookmark.is_favorite ? 'secondary' : 'outline'} size="sm" className="gap-1.5 text-xs" onClick={handleFavorite}>
              <Star className={`h-3.5 w-3.5 ${bookmark.is_favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
              {bookmark.is_favorite ? 'Unfavorite' : 'Favorite'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleArchive}>
              <Archive className="h-3.5 w-3.5" />
              {bookmark.is_archived ? 'Restore' : 'Archive'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Trash
            </Button>
          </div>

          <Separator />

          {/* Description */}
          {bookmark.description && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{bookmark.description}</p>
            </div>
          )}

          {/* Tags */}
          {bookmark.tags.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1">
                {bookmark.tags.map(t => (
                  <Badge key={t.id} variant="secondary" className="text-xs"># {t.name}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Note */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Note</p>
              {!editingNote && (
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => setEditingNote(true)}>
                  <Pencil className="h-3 w-3" />
                  {note ? 'Edit' : 'Add note'}
                </Button>
              )}
            </div>
            {editingNote ? (
              <div className="space-y-2">
                <Textarea value={note} onChange={e => setNote(e.target.value)} rows={4} className="text-sm" placeholder="Write a note…" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveNote} disabled={savingNote}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setNote(bookmark.note ?? ''); setEditingNote(false) }}>Cancel</Button>
                </div>
              </div>
            ) : (
              note ? <p className="text-sm whitespace-pre-wrap">{note}</p> : <p className="text-sm text-muted-foreground italic">No note yet</p>
            )}
          </div>

          <Separator />

          {/* Highlights */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Highlights</p>
            <div className="space-y-2">
              {highlights.map(h => (
                <div key={h.id} className={`group relative rounded-md px-3 py-2 text-sm ${colorStyles[h.color] ?? colorStyles.yellow}`}>
                  <p>{h.text}</p>
                  {h.note && <p className="mt-1 text-xs text-muted-foreground italic">{h.note}</p>}
                  <button
                    onClick={() => removeHighlight(h.id)}
                    className="absolute right-1 top-1 hidden rounded p-0.5 hover:bg-black/10 group-hover:block"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="space-y-2">
                <Textarea
                  value={newHighlight}
                  onChange={e => setNewHighlight(e.target.value)}
                  placeholder="Paste a highlight…"
                  rows={2}
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {HIGHLIGHT_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setHighlightColor(c)}
                        className={`h-4 w-4 rounded-full transition-all ${colorStyles[c]} ${highlightColor === c ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                      />
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto gap-1 text-xs" onClick={addHighlight} disabled={!newHighlight.trim()}>
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Meta */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Saved {formatDate(bookmark.created_at)}</p>
            {bookmark.updated_at !== bookmark.created_at && <p>Updated {formatDate(bookmark.updated_at)}</p>}
            {bookmark.site_name && <p>From {bookmark.site_name}</p>}
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <Button variant="outline" className="w-full gap-2 text-sm" asChild>
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open original
          </a>
        </Button>
      </div>
    </div>
  )
}
