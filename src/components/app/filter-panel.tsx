'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { FilterState, BookmarkType, DateRange } from '@/types'

const TYPES: BookmarkType[] = ['link', 'article', 'video', 'image', 'pdf', 'file']
const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'older', label: 'Older' },
]

interface FilterPanelProps {
  filters: FilterState
  onChange: (f: FilterState) => void
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  function toggleType(t: BookmarkType) {
    const next = filters.types.includes(t) ? filters.types.filter(x => x !== t) : [...filters.types, t]
    onChange({ ...filters, types: next })
  }

  function setDate(d: DateRange) {
    onChange({ ...filters, dateRange: filters.dateRange === d ? '' : d })
  }

  return (
    <div className="border-b bg-muted/30 px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Type</span>
        <div className="flex flex-wrap gap-1">
          {TYPES.map(t => (
            <Badge
              key={t}
              variant={filters.types.includes(t) ? 'default' : 'outline'}
              className="cursor-pointer select-none text-xs capitalize"
              onClick={() => toggleType(t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Added</span>
        <div className="flex gap-1">
          {DATE_OPTIONS.map(opt => (
            <Badge
              key={opt.value}
              variant={filters.dateRange === opt.value ? 'default' : 'outline'}
              className="cursor-pointer select-none text-xs"
              onClick={() => setDate(opt.value)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Domain</span>
        <Input
          value={filters.domain}
          onChange={e => onChange({ ...filters, domain: e.target.value })}
          placeholder="e.g. github.com"
          className="h-6 w-32 text-xs"
        />
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="h-6 gap-1 text-xs ml-auto"
        onClick={() => onChange({ types: [], dateRange: '', domain: '' })}
      >
        <X className="h-3 w-3" />
        Clear filters
      </Button>
    </div>
  )
}
