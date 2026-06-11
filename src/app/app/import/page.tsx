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
              <CardDescription>Columns: url, title, description, tags, collection, note</CardDescription>
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

async function importCsv(csv: string): Promise<ImportResult> {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  let imported = 0; let failed = 0; const errors: string[] = []

  for (const line of lines.slice(1)) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => row[h] = cols[i] ?? '')
    const url = row.url
    if (!url?.startsWith('http')) { failed++; continue }
    const tags = row.tags ? row.tags.split('|').map(t => t.trim()) : []
    try {
      const r = await createBookmark({
        url,
        title: row.title || getDomain(url),
        description: row.description || undefined,
        note: row.note || undefined,
        type: 'link',
        tags,
      })
      if (r.error) { failed++; errors.push(r.error) }
      else imported++
    } catch { failed++ }
  }
  return { imported, failed, errors }
}
