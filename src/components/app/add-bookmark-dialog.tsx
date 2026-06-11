'use client'

import { useState, useTransition } from 'react'
import { Loader2, Link as LinkIcon, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { createBookmark } from '@/app/actions/bookmarks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CollectionWithChildren, UrlMetadata } from '@/types'

interface AddBookmarkDialogProps {
  open: boolean
  onClose: () => void
  collections: CollectionWithChildren[]
}

export function AddBookmarkDialog({ open, onClose, collections }: AddBookmarkDialogProps) {
  const [url, setUrl] = useState('')
  const [meta, setMeta] = useState<UrlMetadata | null>(null)
  const [fetching, setFetching] = useState(false)
  const [collectionId, setCollectionId] = useState<string>('none')
  const [tags, setTags] = useState('')
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()

  async function fetchMeta() {
    if (!url.trim()) return
    setFetching(true)
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(url.trim())}`)
      const data = await res.json()
      if (!data.error) setMeta(data)
    } catch {
      toast.error('Failed to fetch URL metadata')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    const finalMeta = meta ?? {
      url: url.trim(),
      title: url.trim(),
      canonical_url: null,
      normalized_url: url.trim(),
      description: null,
      site_name: null,
      domain: '',
      favicon_url: null,
      image_url: null,
      type: 'link' as const,
    }

    startTransition(async () => {
      const result = await createBookmark({
        url: finalMeta.url,
        title: finalMeta.title,
        description: finalMeta.description ?? undefined,
        image_url: finalMeta.image_url,
        favicon_url: finalMeta.favicon_url,
        site_name: finalMeta.site_name,
        canonical_url: finalMeta.canonical_url,
        type: finalMeta.type,
        note: note.trim() || undefined,
        collection_id: collectionId === 'none' ? null : collectionId,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Bookmark saved!')
        handleClose()
      }
    })
  }

  function handleClose() {
    setUrl('')
    setMeta(null)
    setCollectionId('none')
    setTags('')
    setNote('')
    onClose()
  }

  const flatCollections = flattenCollections(collections)

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save a link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onBlur={fetchMeta}
                className="pl-8"
                required
                type="url"
              />
            </div>
            <Button type="button" variant="outline" size="icon" onClick={fetchMeta} disabled={fetching || !url.trim()}>
              {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            </Button>
          </div>

          {meta && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-start gap-2">
                {meta.favicon_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meta.favicon_url} alt="" width={16} height={16} className="mt-0.5 shrink-0 rounded" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <Input
                    value={meta.title}
                    onChange={e => setMeta(m => m ? { ...m, title: e.target.value } : m)}
                    placeholder="Title"
                    className="h-7 text-sm"
                  />
                  <Textarea
                    value={meta.description ?? ''}
                    onChange={e => setMeta(m => m ? { ...m, description: e.target.value } : m)}
                    placeholder="Description"
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {flatCollections.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {'  '.repeat(c.depth)}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="dev, design, ref"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a personal note…" rows={2} className="text-sm" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !url.trim()}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function flattenCollections(collections: CollectionWithChildren[], depth = 0): (CollectionWithChildren & { depth: number })[] {
  const result: (CollectionWithChildren & { depth: number })[] = []
  for (const c of collections) {
    result.push({ ...c, depth })
    if (c.children?.length) {
      result.push(...flattenCollections(c.children, depth + 1))
    }
  }
  return result
}
