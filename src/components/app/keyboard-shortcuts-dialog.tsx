'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const SHORTCUTS = [
  { group: 'Navigation' },
  { keys: ['N'], desc: 'New bookmark' },
  { keys: ['/'], desc: 'Focus search' },
  { keys: ['Esc'], desc: 'Clear selection / close panel' },
  { keys: ['⌘', 'K'], desc: 'Command palette' },
  { group: 'Selection' },
  { keys: ['F'], desc: 'Toggle favorite' },
  { keys: ['A'], desc: 'Toggle archive' },
  { keys: ['⌫'], desc: 'Move to trash' },
  { group: 'Other' },
  { keys: ['?'], desc: 'Show this help' },
  { keys: ['⌘', 'E'], desc: 'Export bookmarks' },
  { keys: ['⌘', 'I'], desc: 'Import bookmarks' },
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-0.5">
          {SHORTCUTS.map((s, i) =>
            'group' in s ? (
              <div key={i}>
                {i > 0 && <Separator className="my-2" />}
                <p className="text-xs font-medium text-muted-foreground mb-1">{s.group}</p>
              </div>
            ) : (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{s.desc}</span>
                <div className="flex items-center gap-0.5">
                  {s.keys.map((k, j) => (
                    <kbd key={j} className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 text-xs font-mono">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
