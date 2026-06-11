'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Toolbar } from '@/components/app/toolbar'
import { BookmarkViews } from '@/components/app/bookmark-views'
import { BookmarkDetailDrawer } from '@/components/app/bookmark-detail-drawer'
import { AddBookmarkDialog } from '@/components/app/add-bookmark-dialog'
import { getBookmarks, bulkAction } from '@/app/actions/bookmarks'
import { getCollections } from '@/app/actions/collections'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { BookmarkWithTags, CollectionWithChildren, SortMode, ViewMode } from '@/types'

interface BookmarksPageProps {
  title: string
  filter?: 'all' | 'favorites' | 'archive' | 'trash' | 'collection'
  collectionId?: string
}

export function BookmarksPage({ title, filter = 'all', collectionId }: BookmarksPageProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkWithTags[]>([])
  const [collections, setCollections] = useState<CollectionWithChildren[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [sort, setSort] = useState<SortMode>('newest')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openBookmark, setOpenBookmark] = useState<BookmarkWithTags | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [bResult, cResult] = await Promise.all([
      getBookmarks({ filter, collectionId, search, sort }),
      getCollections(),
    ])
    if (bResult.data) setBookmarks(bResult.data)
    if (cResult.data) setCollections(cResult.data)
    setLoading(false)
  }, [filter, collectionId, search, sort])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = () => load()
    window.addEventListener('bookmark-updated', handler)
    return () => window.removeEventListener('bookmark-updated', handler)
  }, [load])

  function handleSelect(id: string, checked: boolean) {
    setSelected(s => {
      const next = new Set(s)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected)
    const action = filter === 'trash' ? 'permanent-delete' : 'delete'
    const result = await bulkAction(ids, action)
    if (result.error) toast.error(result.error)
    else {
      toast.success(`${ids.length} bookmarks deleted`)
      setSelected(new Set())
      await load()
    }
    setConfirmDelete(false)
  }

  const selectedIds = Array.from(selected)
  const hasSelection = selectedIds.length > 0

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        title={title}
        count={bookmarks.length}
        search={search}
        onSearch={setSearch}
        view={view}
        onView={setView}
        sort={sort}
        onSort={setSort}
        onAddBookmark={() => setAddOpen(true)}
      />

      {hasSelection && (
        <div className="flex items-center gap-2 border-b bg-accent/20 px-4 py-2 text-sm">
          <span className="text-muted-foreground">{selectedIds.length} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => { await bulkAction(selectedIds, 'archive'); setSelected(new Set()); load() }}>Archive</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => { await bulkAction(selectedIds, 'favorite'); setSelected(new Set()); load() }}>Favorite</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => setConfirmDelete(true)}>
            {filter === 'trash' ? 'Delete permanently' : 'Move to trash'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <BookmarkViews
            bookmarks={bookmarks}
            view={view}
            selected={selected}
            onSelect={handleSelect}
            onOpen={setOpenBookmark}
            loading={loading}
          />
        </div>
        <BookmarkDetailDrawer bookmark={openBookmark} onClose={() => setOpenBookmark(null)} />
      </div>

      <AddBookmarkDialog open={addOpen} onClose={() => { setAddOpen(false); load() }} collections={collections} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} bookmarks?</AlertDialogTitle>
            <AlertDialogDescription>
              {filter === 'trash' ? 'This will permanently delete these bookmarks. This action cannot be undone.' : 'This will move them to trash.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
