'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { deleteBookmark } from '@/app/actions/bookmarks'
import { formatDate } from '@/lib/utils'
import type { Bookmark } from '@/types'

export default function BrokenLinksPage() {
  const [broken, setBroken] = useState<Bookmark[]>([])
  const [checking, setChecking] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_broken', true)
      .eq('is_deleted', false)
    if (data) setBroken(data as Bookmark[])
  }

  useEffect(() => { load() }, [])

  async function checkOne(b: Bookmark) {
    setChecking(b.id)
    try {
      await fetch('/api/check-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: b.url, bookmark_id: b.id }),
      })
      await load()
    } catch {
      toast.error('Failed to check link')
    } finally {
      setChecking(null)
    }
  }

  async function handleDelete(id: string) {
    const r = await deleteBookmark(id)
    if (r.error) toast.error(r.error)
    else load()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-4">
        <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
        <h1 className="text-base font-semibold">Broken Links</h1>
        <span className="ml-2 text-sm text-muted-foreground">({broken.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {broken.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-muted-foreground">No broken links detected.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {broken.map(b => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.url}</p>
                  {b.last_checked_at && <p className="text-xs text-muted-foreground">Checked {formatDate(b.last_checked_at)}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={checking === b.id} onClick={() => checkOne(b)}>
                  <RefreshCw className={`h-3.5 w-3.5 ${checking === b.id ? 'animate-spin' : ''}`} />
                </Button>
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
