import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single()

  if (!collection) return new NextResponse('Not found', { status: 404 })

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('url, title, description, created_at, domain')
    .eq('collection_id', collection.id)
    .eq('is_deleted', false)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(50)

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://linkvault.app'

  const items = (bookmarks ?? []).map(b => `
    <item>
      <title><![CDATA[${b.title}]]></title>
      <link>${escapeXml(b.url)}</link>
      <guid isPermaLink="true">${escapeXml(b.url)}</guid>
      ${b.description ? `<description><![CDATA[${b.description}]]></description>` : ''}
      <pubDate>${new Date(b.created_at).toUTCString()}</pubDate>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${collection.name} — LinkVault]]></title>
    <link>${site}/share/${slug}</link>
    <description><![CDATA[${collection.description ?? collection.name}]]></description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site}/api/rss/${slug}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

function escapeXml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
