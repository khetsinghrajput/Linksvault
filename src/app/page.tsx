import Link from 'next/link'
import { Bookmark, Star, Search, Tag, Archive, Share2, Lock, Zap, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  const features = [
    { icon: Bookmark, title: 'Save anything', description: 'Paste any URL and we auto-fetch the title, description, image, and favicon.' },
    { icon: Star, title: 'Smart collections', description: 'Organize with nested collections, tags, and smart filters like Favorites, Archive, and Trash.' },
    { icon: Search, title: 'Full-text search', description: 'Search across titles, descriptions, notes, tags, and even your highlights.' },
    { icon: Tag, title: 'Flexible tagging', description: 'Add multiple tags, autocomplete from existing ones, merge and rename tags.' },
    { icon: Archive, title: 'Multiple views', description: 'Switch between list, grid, compact, and masonry views per collection.' },
    { icon: Share2, title: 'Share collections', description: 'Make any collection public with a shareable link — no login required to view.' },
    { icon: Lock, title: 'Private by default', description: 'Row-level security ensures your data is never visible to others by default.' },
    { icon: Zap, title: 'Fast & keyboard-first', description: '⌘K command palette, keyboard shortcuts, and instant search.' },
    { icon: Layers, title: 'Highlights & notes', description: 'Add personal notes and text highlights with color coding to any bookmark.' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">LinkVault</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6">Free · Open · No tracking</Badge>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Your links,{' '}
          <span className="text-primary">organized.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          LinkVault is a bookmark manager built for people who read a lot. Save URLs with one click, organize them into collections, annotate them with notes and highlights, and find anything instantly.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/signup">Start for free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold mb-12">Everything you need to manage your reading</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="rounded-lg border p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to declutter your browser?</h2>
        <p className="text-muted-foreground mb-8">Create a free account. No credit card required.</p>
        <Button size="lg" asChild>
          <Link href="/auth/signup">Get started — it is free</Link>
        </Button>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>LinkVault · Built with Next.js + Supabase</p>
      </footer>
    </div>
  )
}
