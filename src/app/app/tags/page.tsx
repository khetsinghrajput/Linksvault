'use client'

import { useState, useEffect } from 'react'
import { Hash, Pencil, Merge, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getTags, renameTag, deleteTag, mergeTags } from '@/app/actions/tags'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Tag } from '@/types'

type TagWithCount = Tag & { count: number }

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [editTag, setEditTag] = useState<TagWithCount | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<TagWithCount | null>(null)
  const [mergeSource, setMergeSource] = useState<TagWithCount | null>(null)
  const [mergeTarget, setMergeTarget] = useState<string>('')

  async function load() {
    const r = await getTags()
    if (r.data) setTags(r.data)
  }

  useEffect(() => { load() }, [])

  async function handleRename() {
    if (!editTag || !editName.trim()) return
    const r = await renameTag(editTag.id, editName)
    if (r.error) toast.error(r.error)
    else { toast.success('Tag renamed'); setEditTag(null); load() }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const r = await deleteTag(deleteTarget.id)
    if (r.error) toast.error(r.error)
    else { toast.success('Tag deleted'); setDeleteTarget(null); load() }
  }

  async function handleMerge() {
    if (!mergeSource || !mergeTarget) return
    const r = await mergeTags(mergeSource.id, mergeTarget)
    if (r.error) toast.error(r.error)
    else { toast.success('Tags merged'); setMergeSource(null); load() }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-base font-semibold">Tags</h1>
        <span className="ml-2 text-sm text-muted-foreground">({tags.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">🏷️</div>
            <p className="text-muted-foreground">No tags yet. Add tags to your bookmarks to see them here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tags.map(tag => (
              <div key={tag.id} className="group flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-accent/30">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{tag.name}</span>
                  <Badge variant="secondary" className="text-xs">{tag.count}</Badge>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditTag(tag); setEditName(tag.name) }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMergeSource(tag)}>
                    <Merge className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(tag)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename dialog */}
      <Dialog open={!!editTag} onOpenChange={v => !v && setEditTag(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Rename tag</DialogTitle></DialogHeader>
          <Input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTag(null)}>Cancel</Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge dialog */}
      <Dialog open={!!mergeSource} onOpenChange={v => !v && setMergeSource(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Merge "{mergeSource?.name}" into…</DialogTitle></DialogHeader>
          <Select value={mergeTarget} onValueChange={setMergeTarget}>
            <SelectTrigger><SelectValue placeholder="Select target tag" /></SelectTrigger>
            <SelectContent>
              {tags.filter(t => t.id !== mergeSource?.id).map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeSource(null)}>Cancel</Button>
            <Button onClick={handleMerge} disabled={!mergeTarget}>Merge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the tag from all bookmarks. The bookmarks won't be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
