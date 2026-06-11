'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Toolbar } from '@/components/app/toolbar'
import { BookmarkViews } from '@/components/app/bookmark-views'
import { BookmarkDetailDrawer } from '@/components/app/bookmark-detail-drawer'
import { AddBookmarkDialog } from '@/components/app/add-bookmark-dialog'
import { FilterPanel } from '@/components/app/filter-panel'
import { KeyboardShortcutsDialog } from '@/components/app/keyboard-shortcuts-dialog'
import { getBookmarks, bulkAction, uploadFileBookmark, bulkMove } from '@/app/actions/bookmarks'
import { getCollections } from '@/app/actions/collections'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BookmarkWithTags, CollectionWithChildren, SortMode, ViewMode, FilterState } from '@/types'
import { EMPTY_FILTER, hasActiveFilters } from '@/types'

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
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [bResult, cResult] = await Promise.all([
      getBookmarks({
        filter, collectionId, search, sort,
        types: filters.types.length ? filters.types : undefined,
        domain: filters.domain || undefined,
        dateRange: filters.dateRange || undefined,
      }),
      getCollections(),
    ])
    if (bResult.data) setBookmarks(bResult.data)
    if (cResult.data) setCollections(cResult.data)
    setLoading(false)
  }, [filter, collectionId, search, sort, filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = () => load()
    window.addEventListener('bookmark-updated', handler)
    return () => window.removeEventListener('bookmark-updated', handler)
  }, [load])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable
      if (e.key === '?' && !typing) { setShortcutsOpen(v => !v); return }
      if (e.key === 'Escape') { setSelected(new Set()); setOpenBookmark(null); return }
      if (e.key === '/' && !typing) { e.preventDefault(); searchRef.current?.focus(); return }
      if (e.key === 'n' && !typing && !e.metaKey && !e.ctrlKey) { setAddOpen(true); return }
      if (typing) return
      if (e.key === 'f' && selected.size > 0) { bulkAction(Array.from(selected), 'favorite').then(load); return }
      if (e.key === 'a' && selected.size > 0) { bulkAction(Array.from(selected), 'archive').then(load); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected.size > 0) { setConfirmDelete(true); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, load])

  function handleSelect(id: string, checked: boolean) {
    setSelected(s => {
      const next = new Set(s)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const fd = new FormData()
    fd.append('file', file)
    const r = await uploadFileBookmark(fd)
    if (r.error) toast.error(r.error)
    else { toast.success(`"${file.name}" saved as a bookmark`); load() }
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

  async function handleBulkMove(targetCollectionId: string) {
    const ids = Array.from(selected)
    const r = await bulkMove(ids, targetCollectionId)
    if (r.error) toast.error(r.error)
    else { toast.success(`Moved ${ids.length} bookmarks`); setSelected(new Set()); load() }
  }

  const selectedIds = Array.from(selected)
  const hasSelection = selectedIds.length > 0
  const flatCollections = flattenCollections(collections)

  return (
    <div className="flex h-full flex-col">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
      <Toolbar
        title={title}
        count={bookmarks.length}
        search={search}
        searchRef={searchRef}
        onSearch={setSearch}
        view={view}
        onView={setView}
        sort={sort}
        onSort={setSort}
        onAddBookmark={() => setAddOpen(true)}
        onUploadFile={() => fileInputRef.current?.click()}
        onFilterToggle={() => setFilterOpen(v => !v)}
        filtersActive={hasActiveFilters(filters)}
        onShortcuts={() => setShortcutsOpen(true)}
      />

      {filterOpen && (
        <FilterPanel filters={filters} onChange={f => { setFilters(f) }} />
      )}

      {hasSelection && (
        <div className="flex items-center gap-2 border-b bg-accent/20 px-4 py-2 text-sm flex-wrap">
          <span className="text-muted-foreground">{selectedIds.length} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => { await bulkAction(selectedIds, 'archive'); setSelected(new Set()); load() }}>Archive</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => { await bulkAction(selectedIds, 'favorite'); setSelected(new Set()); load() }}>Favorite</Button>
          {flatCollections.length > 0 && (
            <Select onValueChange={handleBulkMove}>
              <SelectTrigger className="h-7 w-40 text-xs">
                <SelectValue placeholder="Move to…" />
              </SelectTrigger>
              <SelectContent>
                {flatCollections.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">{c.indent}{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

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

function flattenCollections(cols: CollectionWithChildren[], depth = 0): { id: string; name: string; indent: string }[] {
  const result: { id: string; name: string; indent: string }[] = []
  for (const c of cols) {
    result.push({ id: c.id, name: c.name, indent: depth > 0 ? ' '.repeat(depth * 3) : '' })
    if (c.children?.length) result.push(...flattenCollections(c.children, depth + 1))
  }
  return result
}
