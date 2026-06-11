import { normalizeUrl, urlsAreDuplicates, isValidUrl, getDomain } from '../url-utils'

describe('normalizeUrl', () => {
  it('strips protocol differences (http → https)', () => {
    expect(normalizeUrl('http://example.com')).toBe('https://example.com/')
  })

  it('strips www prefix', () => {
    expect(normalizeUrl('https://www.example.com')).toBe('https://example.com/')
  })

  it('strips trailing slash from path', () => {
    expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path')
  })

  it('strips hash fragments', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page')
  })

  it('strips utm_source parameter', () => {
    const url = 'https://example.com/article?utm_source=twitter&utm_medium=social'
    expect(normalizeUrl(url)).toBe('https://example.com/article')
  })

  it('strips fbclid parameter', () => {
    const url = 'https://example.com/page?fbclid=abc123'
    expect(normalizeUrl(url)).toBe('https://example.com/page')
  })

  it('preserves meaningful query params', () => {
    const url = 'https://example.com/search?q=hello'
    expect(normalizeUrl(url)).toContain('q=hello')
  })
})

describe('urlsAreDuplicates', () => {
  it('detects http vs https as duplicates', () => {
    expect(urlsAreDuplicates('http://example.com', 'https://example.com')).toBe(true)
  })

  it('detects www vs non-www as duplicates', () => {
    expect(urlsAreDuplicates('https://www.example.com', 'https://example.com')).toBe(true)
  })

  it('detects trailing slash differences as duplicates', () => {
    expect(urlsAreDuplicates('https://example.com/page/', 'https://example.com/page')).toBe(true)
  })

  it('does not flag different URLs as duplicates', () => {
    expect(urlsAreDuplicates('https://example.com/a', 'https://example.com/b')).toBe(false)
  })
})

describe('isValidUrl', () => {
  it('accepts https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('accepts http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('rejects bare strings', () => {
    expect(isValidUrl('not a url')).toBe(false)
  })

  it('rejects javascript: protocol', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('getDomain', () => {
  it('extracts domain without www', () => {
    expect(getDomain('https://www.github.com/user/repo')).toBe('github.com')
  })

  it('returns empty string for invalid URL', () => {
    expect(getDomain('not a url')).toBe('')
  })
})
