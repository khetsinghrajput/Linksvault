'use client'

import { Search, Plus, LayoutList, LayoutGrid, Columns, AlignJustify, ArrowUpDown, Paperclip, SlidersHorizontal, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ViewMode, SortMode } from '@/types'

interface ToolbarProps {
  title: string
  count?: number
  search: string
  searchRef?: React.RefObject<HTMLInputElement | null>
  onSearch: (q: string) => void
  view: ViewMode
  onView: (v: ViewMode) => void
  sort: SortMode
  onSort: (s: SortMode) => void
  onAddBookmark: () => void
  onUploadFile?: () => void
  onFilterToggle?: () => void
  filtersActive?: boolean
  onShortcuts?: () => void
}

const viewIcons: Record<ViewMode, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  list: { icon: LayoutList, label: 'List' },
  grid: { icon: LayoutGrid, label: 'Grid' },
  compact: { icon: AlignJustify, label: 'Compact' },
  masonry: { icon: Columns, label: 'Masonry' },
}

export function Toolbar({ title, count, search, searchRef, onSearch, view, onView, sort, onSort, onAddBookmark, onUploadFile, onFilterToggle, filtersActive, onShortcuts }: ToolbarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <div className="flex-1">
        <h1 className="text-base font-semibold">{title}</h1>
        {count !== undefined && <p className="text-xs text-muted-foreground">{count} links</p>}
      </div>

      <div className="relative w-56">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          placeholder="Search…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-1">
        {(Object.entries(viewIcons) as [ViewMode, typeof viewIcons[ViewMode]][]).map(([v, { icon: Icon, label }]) => (
          <Tooltip key={v}>
            <TooltipTrigger asChild>
              <Button
                variant={view === v ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onView(v)}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Select value={sort} onValueChange={v => onSort(v as SortMode)}>
        <SelectTrigger className="h-8 w-36 text-sm">
          <ArrowUpDown className="mr-2 h-3.5 w-3.5 opacity-60" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="title">Title A–Z</SelectItem>
          <SelectItem value="domain">Domain</SelectItem>
        </SelectContent>
      </Select>

      {onFilterToggle && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant={filtersActive ? 'secondary' : 'ghost'} className="h-8 w-8" onClick={onFilterToggle}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Filter</TooltipContent>
        </Tooltip>
      )}

      {onShortcuts && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onShortcuts}>
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts</TooltipContent>
        </Tooltip>
      )}

      {onUploadFile && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={onUploadFile}>
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload file</TooltipContent>
        </Tooltip>
      )}

      <Button size="sm" className="h-8 gap-1.5" onClick={onAddBookmark}>
        <Plus className="h-4 w-4" />
        Add link
      </Button>
    </div>
  )
}
