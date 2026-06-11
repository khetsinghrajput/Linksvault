'use client'

import Image from 'next/image'
import { Star, Archive, Trash2, ExternalLink, MoreVertical, FileText, Video, File, Globe, AlertTriangle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeDate, truncate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toggleFavorite, toggleArchive, deleteBookmark } from '@/app/actions/bookmarks'
import { toast } from 'sonner'
import type { BookmarkWithTags } from '@/types'

interface BookmarkCardProps {
  bookmark: BookmarkWithTags
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
  onOpen?: (bookmark: BookmarkWithTags) => void
  compact?: boolean
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  pdf: FileText,
  file: File,
  image: Globe,
  article: FileText,
  link: Globe,
}

export function BookmarkCard({ bookmark, selected, onSelect, onOpen, compact }: BookmarkCardProps) {
  const TypeIcon = typeIcons[bookmark.type] ?? Globe

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    const result = await toggleFavorite(bookmark.id, !bookmark.is_favorite)
    if (result.error) toast.error(result.error)
  }

  async function handleArchive() {
    const result = await toggleArchive(bookmark.id, !bookmark.is_archived)
    if (result.error) toast.error(result.error)
    else toast.success(bookmark.is_archived ? 'Restored from archive' : 'Archived')
  }

  async function handleDelete() {
    const result = await deleteBookmark(bookmark.id)
    if (result.error) toast.error(result.error)
    else toast.success('Moved to trash')
  }

  if (compact) {
    return (
      <div
        className={cn('group flex items-center gap-2 border-b px-3 py-2 hover:bg-accent/30 cursor-pointer transition-colors', selected && 'bg-accent/50')}
        onClick={() => onOpen?.(bookmark)}
      >
        {onSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={c => onSelect(bookmark.id, !!c)}
            onClick={e => e.stopPropagation()}
          />
        )}
        <Favicon url={bookmark.favicon_url} domain={bookmark.domain} size={14} />
        <span className="flex-1 truncate text-sm">{bookmark.title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{bookmark.domain}</span>
        <BookmarkActions bookmark={bookmark} onFavorite={handleFavorite} onArchive={handleArchive} onDelete={handleDelete} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary'
      )}
      onClick={() => onOpen?.(bookmark)}
    >
      {onSelect && (
        <Checkbox
          className="absolute left-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 data-[state=checked]:opacity-100"
          checked={selected}
          onCheckedChange={c => onSelect(bookmark.id, !!c)}
          onClick={e => e.stopPropagation()}
        />
      )}

      {bookmark.image_url && !compact && (
        <div className="relative h-36 w-full overflow-hidden rounded-md bg-muted">
          <Image
            src={bookmark.image_url}
            alt={bookmark.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="flex items-start gap-2">
        <Favicon url={bookmark.favicon_url} domain={bookmark.domain} size={16} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{bookmark.title}</p>
          <p className="text-xs text-muted-foreground">{bookmark.domain}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {bookmark.is_broken && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
          {bookmark.reminder_at && <Bell className="h-3.5 w-3.5 text-amber-500" />}
          <button
            onClick={handleFavorite}
            className={cn('h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity', bookmark.is_favorite && 'opacity-100 text-amber-500')}
          >
            <Star className={cn('h-3.5 w-3.5', bookmark.is_favorite && 'fill-current')} />
          </button>
          <BookmarkActions bookmark={bookmark} onFavorite={handleFavorite} onArchive={handleArchive} onDelete={handleDelete} />
        </div>
      </div>

      {bookmark.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{bookmark.description}</p>
      )}

      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bookmark.tags.slice(0, 4).map(tag => (
            <Badge key={tag.id} variant="secondary" className="h-4 px-1.5 text-[10px]">
              {tag.name}
            </Badge>
          ))}
          {bookmark.tags.length > 4 && (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">+{bookmark.tags.length - 4}</Badge>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <TypeIcon className="h-3 w-3" />
        <span>{formatRelativeDate(bookmark.created_at)}</span>
      </div>
    </div>
  )
}

function Favicon({ url, domain, size }: { url: string | null; domain: string | null; size: number }) {
  if (!url) {
    return (
      <div className="shrink-0 rounded bg-muted" style={{ width: size, height: size }}>
        <Globe className="h-full w-full p-0.5 text-muted-foreground" />
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={domain ?? ''}
      width={size}
      height={size}
      className="shrink-0 rounded object-contain"
      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

function BookmarkActions({ bookmark, onFavorite, onArchive, onDelete }: {
  bookmark: BookmarkWithTags
  onFavorite: (e: React.MouseEvent) => void
  onArchive: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={e => { e.stopPropagation(); window.open(bookmark.url, '_blank') }}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open original
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onFavorite(e) }}>
          <Star className="mr-2 h-4 w-4" />
          {bookmark.is_favorite ? 'Unfavorite' : 'Favorite'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onArchive() }}>
          <Archive className="mr-2 h-4 w-4" />
          {bookmark.is_archived ? 'Unarchive' : 'Archive'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete() }} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Move to trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
