'use client'

import { useState, useTransition } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createBookmark } from '@/app/actions/bookmarks'
import { getDomain } from '@/lib/url-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ImportResult { imported: number; failed: number; errors: string[] }

export default function ImportPage() {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleHtmlFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const html = ev.target?.result as string
      startTransition(() => importHtml(html).then(setResult))
    }
    reader.readAsText(file)
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const csv = ev.target?.result as string
      startTransition(() => importCsv(csv).then(setResult))
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-4">
        <Upload className="mr-2 h-4 w-4" />
        <h1 className="text-base font-semibold">Import</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Browser Bookmarks (HTML)</CardTitle>
              <CardDescription>Export from Chrome, Firefox, Safari, or Edge</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-6 hover:border-primary transition-colors">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to choose a .html file</span>
                <input type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlFile} disabled={isPending} />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CSV Import</CardTitle>
              <CardDescription>Supports Raindrop.io exports and generic CSVs (url, title, description, tags, note)</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-6 hover:border-primary transition-colors">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to choose a .csv file</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvFile} disabled={isPending} />
              </label>
            </CardContent>
          </Card>

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Importing…
            </div>
          )}

          {result && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{result.imported} bookmarks imported</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{result.failed} failed</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

async function importHtml(html: string): Promise<ImportResult> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const links = Array.from(doc.querySelectorAll('a[href]'))
    .filter(a => {
      const href = a.getAttribute('href') ?? ''
      return href.startsWith('http://') || href.startsWith('https://')
    })
    .slice(0, 1000)

  let imported = 0; let failed = 0; const errors: string[] = []
  for (const a of links) {
    const url = a.getAttribute('href')!
    const title = a.textContent?.trim() || getDomain(url)
    try {
      const r = await createBookmark({ url, title, type: 'link' })
      if (r.error) { failed++; errors.push(r.error) }
      else imported++
    } catch (e) { failed++ }
  }
  return { imported, failed, errors }
}

// RFC 4180-compliant CSV parser that handles quoted fields with embedded commas/newlines
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2 }
      else if (ch === '"') { inQuotes = false; i++ }
      else { field += ch; i++ }
    } else {
      if (ch === '"') { inQuotes = true; i++ }
      else if (ch === ',') { row.push(field.trim()); field = ''; i++ }
      else if (ch === '\r') { i++ }
      else if (ch === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; i++ }
      else { field += ch; i++ }
    }
  }
  if (field.trim() || row.length > 0) { row.push(field.trim()); rows.push(row) }
  return rows
}

async function importCsv(csv: string): Promise<ImportResult> {
  const rows = parseCSV(csv)
  if (rows.length < 2) return { imported: 0, failed: 0, errors: ['Empty or unreadable CSV'] }

  const headers = rows[0].map(h => h.toLowerCase().trim())
  // Raindrop.io exports use 'excerpt' for description and 'cover' for image
  const isRaindrop = headers.includes('excerpt')
  let imported = 0; let failed = 0; const errors: string[] = []

  for (const cols of rows.slice(1)) {
    if (cols.every(c => !c)) continue // skip blank rows
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = cols[i] ?? '' })

    const url = row.url?.trim()
    if (!url?.startsWith('http')) { failed++; continue }

    const title = (row.title?.trim() || getDomain(url)).slice(0, 500)
    const description = (isRaindrop ? row.excerpt?.trim() : row.description?.trim()) || undefined
    const note = row.note?.trim().slice(0, 5000) || undefined
    const image_url = isRaindrop ? (row.cover?.trim() || undefined) : undefined

    // Support comma-separated (Raindrop) and pipe-separated (generic) tags
    const rawTags = row.tags?.trim() ?? ''
    const tags = rawTags ? rawTags.split(/[,|]/).map(t => t.trim()).filter(Boolean) : []

    try {
      const r = await createBookmark({
        url,
        title,
        description: description?.slice(0, 2000),
        note,
        image_url,
        type: 'link',
        tags,
      })
      if (r.error) { failed++; errors.push(r.error) }
      else imported++
    } catch { failed++ }
  }
  return { imported, failed, errors }
}
