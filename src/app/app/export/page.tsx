'use client'

import { useState } from 'react'
import { Download, FileText, FileJson, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null)

  async function fetchAll() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('bookmarks')
      .select('*, tags:bookmark_tags(tag:tags(name))')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
    return data ?? []
  }

  async function exportJson() {
    setExporting('json')
    const data = await fetchAll()
    if (!data) return setExporting(null)
    download('linkvault-export.json', JSON.stringify(data, null, 2), 'application/json')
    setExporting(null)
  }

  async function exportCsv() {
    setExporting('csv')
    const data = await fetchAll()
    if (!data) return setExporting(null)
    const headers = ['url', 'title', 'description', 'note', 'domain', 'tags', 'collection_id', 'created_at']
    const rows = (data as Record<string, unknown>[]).map(b => headers.map(h => {
      if (h === 'tags') return ((b.tags as Array<{ tag: { name: string } }>) ?? []).map(t => t.tag.name).join('|')
      return String(b[h] ?? '').replace(/,/g, ';')
    }).join(','))
    download('linkvault-export.csv', [headers.join(','), ...rows].join('\n'), 'text/csv')
    setExporting(null)
  }

  async function exportHtml() {
    setExporting('html')
    const data = await fetchAll()
    if (!data) return setExporting(null)
    const links = (data as Record<string, unknown>[]).map(b => `  <DT><A HREF="${b.url}" ADD_DATE="${new Date(b.created_at as string).getTime() / 1000 | 0}">${b.title}</A>`).join('\n')
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${links}\n</DL><p>`
    download('linkvault-bookmarks.html', html, 'text/html')
    setExporting(null)
  }

  function download(name: string, content: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const formats = [
    { id: 'json', label: 'JSON', description: 'Full data export with all fields and metadata', icon: FileJson, action: exportJson },
    { id: 'csv', label: 'CSV', description: 'Spreadsheet-compatible format (url, title, tags, etc.)', icon: FileText, action: exportCsv },
    { id: 'html', label: 'Netscape HTML', description: 'Browser bookmark format (import into Chrome, Firefox, etc.)', icon: Globe, action: exportHtml },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-4">
        <Download className="mr-2 h-4 w-4" />
        <h1 className="text-base font-semibold">Export</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-3">
          {formats.map(f => (
            <Card key={f.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <f.icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">{f.label}</CardTitle>
                  </div>
                  <Button size="sm" onClick={f.action} disabled={exporting === f.id} className="gap-1.5">
                    {exporting === f.id ? (
                      <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> Exporting…</>
                    ) : (
                      <><Download className="h-3.5 w-3.5" /> Export</>
                    )}
                  </Button>
                </div>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
