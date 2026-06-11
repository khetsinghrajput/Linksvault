import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { getDomain, isValidUrl, normalizeUrl } from '@/lib/url-utils'
import type { UrlMetadata, BookmarkType } from '@/types'

function detectType(url: string, contentType: string): BookmarkType {
  if (contentType.includes('pdf') || url.endsWith('.pdf')) return 'pdf'
  if (contentType.startsWith('image/')) return 'image'
  const domain = getDomain(url)
  if (['youtube.com', 'youtu.be', 'vimeo.com'].includes(domain)) return 'video'
  return 'link'
}

function parseFavicon(url: string, $: cheerio.CheerioAPI): string | null {
  const origin = new URL(url).origin
  const rel = $('link[rel="icon"], link[rel="shortcut icon"]').first().attr('href')
  if (rel) {
    if (rel.startsWith('http')) return rel
    if (rel.startsWith('//')) return 'https:' + rel
    return origin + (rel.startsWith('/') ? rel : '/' + rel)
  }
  return `${origin}/favicon.ico`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkVault/1.0; +https://linkvault.app)',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    const contentType = response.headers.get('content-type') ?? ''
    const finalUrl = response.url ?? url

    if (!contentType.includes('text/html')) {
      const type = detectType(url, contentType)
      const meta: UrlMetadata = {
        url,
        canonical_url: finalUrl !== url ? finalUrl : null,
        normalized_url: normalizeUrl(url),
        title: getDomain(url),
        description: null,
        site_name: null,
        domain: getDomain(url),
        favicon_url: null,
        image_url: null,
        type,
      }
      return NextResponse.json(meta)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const get = (selectors: string[]) => {
      for (const s of selectors) {
        const val = $(s).attr('content') ?? $(s).text()
        if (val?.trim()) return val.trim()
      }
      return null
    }

    const canonical = $('link[rel="canonical"]').attr('href') ?? null
    const title =
      get(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ??
      $('title').text().trim() ??
      getDomain(url)

    const meta: UrlMetadata = {
      url,
      canonical_url: canonical,
      normalized_url: normalizeUrl(url),
      title: title.slice(0, 300),
      description: get(['meta[property="og:description"]', 'meta[name="description"]', 'meta[name="twitter:description"]'])?.slice(0, 1000) ?? null,
      site_name: get(['meta[property="og:site_name"]'])?.slice(0, 200) ?? null,
      domain: getDomain(finalUrl),
      favicon_url: parseFavicon(finalUrl, $),
      image_url: get(['meta[property="og:image"]', 'meta[name="twitter:image"]']),
      type: detectType(url, contentType),
    }

    return NextResponse.json(meta)
  } catch {
    return NextResponse.json({
      url,
      canonical_url: null,
      normalized_url: normalizeUrl(url),
      title: getDomain(url),
      description: null,
      site_name: null,
      domain: getDomain(url),
      favicon_url: null,
      image_url: null,
      type: 'link',
    } satisfies UrlMetadata)
  }
}
