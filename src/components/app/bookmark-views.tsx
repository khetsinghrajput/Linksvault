'use client'

import { BookmarkCard } from './bookmark-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { BookmarkWithTags, ViewMode } from '@/types'

interface BookmarkViewsProps {
  bookmarks: BookmarkWithTags[]
  view: ViewMode
  selected: Set<string>
  onSelect: (id: string, checked: boolean) => void
  onOpen: (bookmark: BookmarkWithTags) => void
  loading?: boolean
}

export function BookmarkViews({ bookmarks, view, selected, onSelect, onOpen, loading }: BookmarkViewsProps) {
  if (loading) {
    return (
      <div className={getContainerClass(view)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={getSkeletonClass(view)} />
        ))}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="text-4xl">🔖</div>
        <p className="text-muted-foreground">No bookmarks here yet</p>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div className="divide-y">
        {bookmarks.map(b => (
          <BookmarkCard key={b.id} bookmark={b} selected={selected.has(b.id)} onSelect={onSelect} onOpen={onOpen} />
        ))}
      </div>
    )
  }

  if (view === 'compact') {
    return (
      <div>
        {bookmarks.map(b => (
          <BookmarkCard key={b.id} bookmark={b} selected={selected.has(b.id)} onSelect={onSelect} onOpen={onOpen} compact />
        ))}
      </div>
    )
  }

  if (view === 'masonry') {
    const cols = 3
    const columns: BookmarkWithTags[][] = Array.from({ length: cols }, () => [])
    bookmarks.forEach((b, i) => columns[i % cols].push(b))
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 p-4">
        {columns.map((col, ci) => (
          <div key={ci} className="space-y-3">
            {col.map(b => (
              <BookmarkCard key={b.id} bookmark={b} selected={selected.has(b.id)} onSelect={onSelect} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={getContainerClass(view)}>
      {bookmarks.map(b => (
        <BookmarkCard key={b.id} bookmark={b} selected={selected.has(b.id)} onSelect={onSelect} onOpen={onOpen} />
      ))}
    </div>
  )
}

function getContainerClass(view: ViewMode) {
  if (view === 'grid') return 'grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  return 'divide-y'
}

function getSkeletonClass(view: ViewMode) {
  if (view === 'grid') return 'h-48 rounded-lg'
  return 'h-16 w-full'
}
