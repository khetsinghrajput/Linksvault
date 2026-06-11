'use client'

import { useState, useEffect } from 'react'
import { Bell, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Bookmark } from '@/types'

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Bookmark[]>([])
  const now = new Date().toISOString()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', data.user.id)
        .not('reminder_at', 'is', null)
        .eq('is_deleted', false)
        .order('reminder_at', { ascending: true })
        .then(({ data: rows }) => { if (rows) setReminders(rows as Bookmark[]) })
    })
  }, [])

  const overdue = reminders.filter(r => r.reminder_at! < now)
  const upcoming = reminders.filter(r => r.reminder_at! >= now)

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-4">
        <Bell className="mr-2 h-4 w-4" />
        <h1 className="text-base font-semibold">Reminders</h1>
        <span className="ml-2 text-sm text-muted-foreground">({reminders.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {reminders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-muted-foreground">No reminders set. Edit a bookmark to add a reminder date.</p>
          </div>
        )}
        {overdue.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-destructive mb-2">Overdue</h2>
            <ReminderList items={overdue} />
          </section>
        )}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-2">Upcoming</h2>
            <ReminderList items={upcoming} />
          </section>
        )}
      </div>
    </div>
  )
}

function ReminderList({ items }: { items: Bookmark[] }) {
  return (
    <div className="space-y-1">
      {items.map(b => (
        <div key={b.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
          <Bell className="h-4 w-4 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{b.title}</p>
            <p className="text-xs text-muted-foreground">{formatDate(b.reminder_at!)}</p>
          </div>
          <a href={b.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      ))}
    </div>
  )
}
