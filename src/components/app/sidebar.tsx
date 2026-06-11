'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bookmark, Star, Archive, Trash2, Tag, Copy, AlertTriangle,
  Bell, Download, Upload, Settings, ChevronDown, ChevronRight,
  Plus, Folder, FolderOpen, MoreHorizontal, Rss, Trash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { makeCollectionPublic, deleteCollection } from '@/app/actions/collections'
import { toast } from 'sonner'
import type { CollectionWithChildren } from '@/types'

interface SidebarProps {
  collections: CollectionWithChildren[]
  onAddCollection?: () => void
}

const smartLinks = [
  { href: '/app/all', label: 'All Links', icon: Bookmark },
  { href: '/app/favorites', label: 'Favorites', icon: Star },
  { href: '/app/archive', label: 'Archive', icon: Archive },
  { href: '/app/trash', label: 'Trash', icon: Trash2 },
]

const toolLinks = [
  { href: '/app/tags', label: 'Tags', icon: Tag },
  { href: '/app/duplicates', label: 'Duplicates', icon: Copy },
  { href: '/app/broken-links', label: 'Broken Links', icon: AlertTriangle },
  { href: '/app/reminders', label: 'Reminders', icon: Bell },
]

const dataLinks = [
  { href: '/app/import', label: 'Import', icon: Upload },
  { href: '/app/export', label: 'Export', icon: Download },
  { href: '/app/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ collections, onAddCollection }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Bookmark className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sidebar-foreground">LinkVault</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          <NavSection>
            {smartLinks.map(({ href, label, icon: Icon }) => (
              <NavItem key={href} href={href} active={pathname === href}>
                <Icon className="h-4 w-4" />
                {label}
              </NavItem>
            ))}
          </NavSection>

          <Separator className="my-2" />

          <NavSection>
            {toolLinks.map(({ href, label, icon: Icon }) => (
              <NavItem key={href} href={href} active={pathname === href}>
                <Icon className="h-4 w-4" />
                {label}
              </NavItem>
            ))}
          </NavSection>

          <Separator className="my-2" />

          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Collections</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddCollection}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {collections.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">No collections yet</p>
          ) : (
            <div className="space-y-0.5">
              {collections.map(c => (
                <CollectionItem key={c.id} collection={c} pathname={pathname} />
              ))}
            </div>
          )}

          <Separator className="my-2" />

          <NavSection>
            {dataLinks.map(({ href, label, icon: Icon }) => (
              <NavItem key={href} href={href} active={pathname === href}>
                <Icon className="h-4 w-4" />
                {label}
              </NavItem>
            ))}
          </NavSection>
        </div>
      </ScrollArea>
    </aside>
  )
}

function NavSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-0.5">{children}</div>
}

function NavItem({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      )}
    >
      {children}
    </Link>
  )
}

function CollectionItem({ collection, pathname, depth = 0 }: { collection: CollectionWithChildren; pathname: string; depth?: number }) {
  const [open, setOpen] = useState(false)
  const hasChildren = collection.children && collection.children.length > 0
  const href = `/app/collections/${collection.id}`
  const active = pathname === href

  const Icon = open && hasChildren ? FolderOpen : Folder
  const iconStyle = collection.color ? { color: collection.color } : undefined

  async function copyRss() {
    const r = await makeCollectionPublic(collection.id, true)
    if (r.error) { toast.error(r.error); return }
    const slug = r.data
    const origin = window.location.origin
    await navigator.clipboard.writeText(`${origin}/api/rss/${slug}`)
    toast.success('RSS feed URL copied to clipboard')
  }

  async function handleDelete() {
    const r = await deleteCollection(collection.id)
    if (r.error) toast.error(r.error)
    else { toast.success(`"${collection.name}" deleted`); window.location.href = '/app/all' }
  }

  const linkClass = cn(
    'flex flex-1 items-center gap-2 rounded-md py-1.5 pr-2 text-sm transition-colors',
    active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
  )

  const contextMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="ml-auto flex h-6 w-6 items-center justify-center rounded opacity-0 group-hover/item:opacity-100 hover:bg-sidebar-accent transition-opacity"
          onClick={e => e.preventDefault()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={copyRss}>
          <Rss className="mr-2 h-4 w-4" />
          Copy RSS link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete collection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div>
      {hasChildren ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="group/item flex items-center">
            <CollapsibleTrigger asChild>
              <button className="flex h-7 w-5 items-center justify-center text-muted-foreground">
                {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            </CollapsibleTrigger>
            <Link href={href} style={{ paddingLeft: `${depth * 8}px` }} className={linkClass}>
              <Icon className="h-4 w-4 shrink-0" style={iconStyle} />
              <span className="truncate">{collection.name}</span>
              {contextMenu}
            </Link>
          </div>
          <CollapsibleContent>
            <div className="pl-2">
              {collection.children!.map(child => (
                <CollectionItem key={child.id} collection={child} pathname={pathname} depth={depth + 1} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="group/item flex items-center">
          <div className="h-7 w-5" />
          <Link href={href} style={{ paddingLeft: `${depth * 8}px` }} className={linkClass}>
            <Folder className="h-4 w-4 shrink-0" style={iconStyle} />
            <span className="truncate">{collection.name}</span>
            {contextMenu}
          </Link>
        </div>
      )}
    </div>
  )
}
