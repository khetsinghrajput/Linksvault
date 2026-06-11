'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Star, Archive, Trash2, Tag, Settings, Plus, Search } from 'lucide-react'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from '@/components/ui/command'

interface CommandMenuProps {
  onAddBookmark: () => void
}

export function CommandMenu({ onAddBookmark }: CommandMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        onAddBookmark()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onAddBookmark])

  function go(path: string) {
    router.push(path)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => { setOpen(false); onAddBookmark() }}>
            <Plus className="mr-2 h-4 w-4" />
            Add bookmark
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('/app/all')}>
            <Bookmark className="mr-2 h-4 w-4" />
            All Links
          </CommandItem>
          <CommandItem onSelect={() => go('/app/favorites')}>
            <Star className="mr-2 h-4 w-4" />
            Favorites
          </CommandItem>
          <CommandItem onSelect={() => go('/app/archive')}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </CommandItem>
          <CommandItem onSelect={() => go('/app/trash')}>
            <Trash2 className="mr-2 h-4 w-4" />
            Trash
          </CommandItem>
          <CommandItem onSelect={() => go('/app/tags')}>
            <Tag className="mr-2 h-4 w-4" />
            Tags
          </CommandItem>
          <CommandItem onSelect={() => go('/app/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
