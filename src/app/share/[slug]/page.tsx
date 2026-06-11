import { notFound } from 'next/navigation'
import { Bookmark, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatRelativeDate } from '@/lib/utils'

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single()

  if (!collection) notFound()

  const { data: rawBookmarks } = await supabase
    .from('bookmarks')
    .select('id, url, title, description, domain, favicon_url, image_url, created_at, tags:bookmark_tags(tag:tags(id, name))')
    .eq('collection_id', collection.id)
    .eq('is_deleted', false)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  type ShareBookmark = {
    id: string; url: string; title: string; description: string | null;
    domain: string | null; favicon_url: string | null; created_at: string;
    tags: { tag: { id: string; name: string } }[]
  }
  const bookmarks = (rawBookmarks ?? []) as unknown as ShareBookmark[]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <span className="font-semibold">LinkVault</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground text-sm">Shared collection</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{collection.name}</h1>
          {collection.description && (
            <p className="text-muted-foreground mt-1">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">{bookmarks.length} links</p>
        </div>

        <div className="space-y-2">
          {bookmarks.map(b => {
            const tags = (b.tags ?? []).map(t => t.tag)
            return (
              <a
                key={b.id}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/30 transition-colors"
              >
                {b.favicon_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.favicon_url} alt="" width={16} height={16} className="mt-1 shrink-0 rounded" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.domain}</p>
                  {b.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</p>}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map(t => (
                        <Badge key={t.id} variant="secondary" className="text-[10px] px-1.5 h-4">#{t.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                  <span className="text-xs">{formatRelativeDate(b.created_at)}</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            )
          })}
        </div>
      </main>
    </div>
  )
}
