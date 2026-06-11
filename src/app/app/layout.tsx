'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/app/sidebar'
import { AddBookmarkDialog } from '@/components/app/add-bookmark-dialog'
import { CommandMenu } from '@/components/app/command-menu'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getCollections } from '@/app/actions/collections'
import { signout } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import type { CollectionWithChildren } from '@/types'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<CollectionWithChildren[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser({
        email: data.user?.email ?? '',
        full_name: data.user?.user_metadata?.full_name ?? '',
      })
    })
    getCollections().then(r => { if (r.data) setCollections(r.data) })
  }, [])

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        {/* Top nav */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-xs">⌘K</span>
            <span>Quick search</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">{user?.full_name || user?.email}</p>
                  {user?.full_name && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/app/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => signout()}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar collections={collections} onAddCollection={() => {}} />
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>

        <AddBookmarkDialog open={addOpen} onClose={() => setAddOpen(false)} collections={collections} />
        <CommandMenu onAddBookmark={() => setAddOpen(true)} />
      </div>
    </TooltipProvider>
  )
}
