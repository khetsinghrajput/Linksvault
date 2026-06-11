'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, File, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { importBookmarksBatch, uploadFileBookmark } from '@/app/actions/bookmarks'
import { getDomain } from '@/lib/url-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ImportResult { imported: number; failed: number; errors: string[] }

const BATCH_SIZE = 100

export default function ImportPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileUploadRef = useRef<HTMLInputElement>(null)

  function handleHtmlFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => runImport(parseHtml(ev.target?.result as string))
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => runImport(parseCsv(ev.target?.result as string))
    reader.readAsText(file)
    e.target.value = ''
  }

  async function runImport(items: Array<{ url: string; title: string; description?: string; image_url?: string; tags?: string[] }>) {
    if (items.length === 0) { setResult({ imported: 0, failed: 0, errors: ['No valid bookmarks found in file'] }); return }
    setIsImporting(true)
    setResult(null)
    setProgress({ done: 0, total: items.length })

    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)
      try {
        const r = await importBookmarksBatch(batch)
        imported += r.imported
        failed += batch.length - r.imported
        errors.push(...r.errors)
      } catch (e) {
        failed += batch.length
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
      setProgress({ done: Math.min(i + BATCH_SIZE, items.length), total: items.length })
    }

    setResult({ imported, failed, errors })
    setIsImporting(false)
    setProgress(null)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadingFile(true)
    const fd = new FormData()
    fd.append('file', file)
    const r = await uploadFileBookmark(fd)
    setUploadingFile(false)
    if (r.error) {
      toast.error(r.error)
    } else {
      toast.success(`"${file.name}" saved as a bookmark`)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-4">
        <Upload className="mr-2 h-4 w-4" />
        <h1 className="text-base font-semibold">Import</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-4">

          {/* HTML bookmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Browser Bookmarks (HTML)</CardTitle>
              <CardDescription>Export from Chrome, Firefox, Safari, or Edge</CardDescription>
            </CardHeader>
            <CardContent>
              <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-6 hover:border-primary transition-colors ${isImporting ? 'pointer-events-none opacity-50' : ''}`}>
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to choose a .html file</span>
                <input type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlFile} disabled={isImporting} />
              </label>
            </CardContent>
          </Card>

          {/* CSV */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CSV Import</CardTitle>
              <CardDescription>Supports Raindrop.io exports and generic CSVs (url, title, description, tags, note)</CardDescription>
            </CardHeader>
            <CardContent>
              <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-6 hover:border-primary transition-colors ${isImporting ? 'pointer-events-none opacity-50' : ''}`}>
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to choose a .csv file</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvFile} disabled={isImporting} />
              </label>
            </CardContent>
          </Card>

          {/* File upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upload a File</CardTitle>
              <CardDescription>Save a PDF, image, or document as a bookmark (max 50 MB). Requires a Supabase storage bucket named "uploads".</CardDescription>
            </CardHeader>
            <CardContent>
              <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-6 hover:border-primary transition-colors ${uploadingFile ? 'pointer-events-none opacity-50' : ''}`}>
                {uploadingFile ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <File className="h-5 w-5 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{uploadingFile ? 'Uploading…' : 'Click to choose a file'}</span>
                <input ref={fileUploadRef} type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
              </label>
            </CardContent>
          </Card>

          {/* Progress */}
          {isImporting && progress && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing {progress.done} of {progress.total}…</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && !isImporting && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{result.imported} bookmarks imported</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{result.failed} failed</span>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="rounded-md bg-destructive/10 p-3 space-y-1">
                    <p className="text-xs font-medium text-destructive">Error details:</p>
                    {result.errors.slice(0, 8).map((e, i) => (
                      <p key={i} className="text-xs text-destructive truncate">{e}</p>
                    ))}
                    {result.errors.length > 8 && (
                      <p className="text-xs text-muted-foreground">…and {result.errors.length - 8} more</p>
                    )}
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

// ── Parsers ────────────────────────────────────────────────────────────────────

function parseHtml(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll('a[href]'))
    .filter(a => { const h = a.getAttribute('href') ?? ''; return h.startsWith('http://') || h.startsWith('https://') })
    .slice(0, 2000)
    .map(a => {
      const url = a.getAttribute('href')!
      return { url, title: a.textContent?.trim() || getDomain(url) || url }
    })
}

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

function parseCsv(csv: string) {
  const rows = parseCSV(csv)
  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.toLowerCase().trim())
  const isRaindrop = headers.includes('excerpt')

  return rows.slice(1).flatMap(cols => {
    if (cols.every(c => !c)) return []
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = cols[i] ?? '' })

    const url = row.url?.trim()
    if (!url?.startsWith('http')) return []

    const title = (row.title?.trim() || getDomain(url) || url).slice(0, 500)
    const description = (isRaindrop ? row.excerpt?.trim() : row.description?.trim())?.slice(0, 2000) || undefined
    const image_url = isRaindrop ? (row.cover?.trim() || undefined) : undefined

    // Skip SideNotes app metadata stored in the note field
    const rawNote = row.note?.trim()
    const note = rawNote && !rawNote.startsWith('SideNotes note_id=') ? rawNote.slice(0, 5000) : undefined

    const rawTags = row.tags?.trim() ?? ''
    const tags = rawTags ? rawTags.split(/[,|]/).map(t => t.trim()).filter(Boolean) : []

    return [{ url, title, description, image_url, note, tags } as { url: string; title: string; description?: string; image_url?: string; tags?: string[] }]
  })
}
