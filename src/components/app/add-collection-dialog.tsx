'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCollection } from '@/app/actions/collections'
import type { CollectionWithChildren } from '@/types'

interface AddCollectionDialogProps {
  open: boolean
  onClose: () => void
  collections: CollectionWithChildren[]
}

export function AddCollectionDialog({ open, onClose, collections }: AddCollectionDialogProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const r = await createCollection({ name: name.trim(), parent_id: parentId || null })
    setSaving(false)
    if (r.error) {
      toast.error(r.error)
    } else {
      toast.success(`Collection "${name.trim()}" created`)
      setName('')
      setParentId('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="col-name">Name</Label>
            <Input
              id="col-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Research, Design, Recipes…"
              autoFocus
            />
          </div>
          {collections.length > 0 && (
            <div className="space-y-1.5">
              <Label>Parent collection (optional)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (top-level)</SelectItem>
                  {flatten(collections).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Creating…' : 'Create collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function flatten(cols: CollectionWithChildren[], depth = 0): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = []
  for (const c of cols) {
    out.push({ id: c.id, label: (depth > 0 ? '  '.repeat(depth) + '↳ ' : '') + c.name })
    if (c.children?.length) out.push(...flatten(c.children, depth + 1))
  }
  return out
}
