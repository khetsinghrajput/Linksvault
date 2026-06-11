'use client'

import { useState, useEffect } from 'react'
import { Copy, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { normalizeUrl } from '@/lib/url-utils'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { permanentDeleteBookmark } from '@/app/actions/bookmarks'
import type { Bookmark } from '@/types'

type DuplicateGroup = { normalized: string; bookmarks: Bookmark[] }

export default function DuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    const map = new Map<string, Bookmark[]>()
    for (const b of data ?? []) {
      const key = normalizeUrl(b.url)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(b as Bookmark)
    }

    const dups: DuplicateGroup[] = []
    map.forEach((bookmarks, normalized) => {
      if (bookmarks.length > 1) dups.push({ normalized, bookmarks })
    })

    setGroups(dups.sort((a, b) => b.bookmarks.length - a.bookmarks.length))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    const r = await permanentDeleteBookmark(id)
    if (r.error) toast.error(r.error)
    else { toast.success('Deleted'); load() }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-4">
        <Copy className="mr-2 h-4 w-4" />
        <h1 className="text-base font-semibold">Duplicates</h1>
        <span className="ml-2 text-sm text-muted-foreground">({groups.length} groups)</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-muted-foreground">Scanning for duplicates…</p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-muted-foreground">No duplicates found. Your vault is clean!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(g => (
              <div key={g.normalized} className="rounded-lg border">
                <div className="flex items-center gap-2 border-b px-3 py-2 bg-muted/30">
                  <Badge variant="secondary">{g.bookmarks.length} copies</Badge>
                  <span className="text-xs text-muted-foreground truncate">{g.normalized}</span>
                </div>
                <div className="divide-y">
                  {g.bookmarks.map(b => (
                    <div key={b.id} className="flex items-center gap-3 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(b.created_at)}</p>
                      </div>
                      <a href={b.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      {g.bookmarks.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
