const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'source', '_ga',
]

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.protocol = 'https:'
    parsed.hostname = parsed.hostname.replace(/^www\./, '')
    parsed.hash = ''
    parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/'
    TRACKING_PARAMS.forEach(p => parsed.searchParams.delete(p))
    return parsed.toString()
  } catch {
    return url
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function urlsAreDuplicates(a: string, b: string): boolean {
  return normalizeUrl(a) === normalizeUrl(b)
}
