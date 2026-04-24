"use client"

import type { MarkdownAction } from "./apply-markdown"

type ActionDef = {
  action: MarkdownAction
  label: string
  weight?: number
  italic?: boolean
  title: string
}

const ACTIONS: ActionDef[] = [
  { action: "bold", label: "B", weight: 600, title: "Bold (⌘B)" },
  { action: "italic", label: "I", italic: true, title: "Italic (⌘I)" },
  { action: "h1", label: "H1", title: "Heading 1" },
  { action: "h2", label: "H2", title: "Heading 2" },
  { action: "list", label: "• list", title: "Bulleted list" },
  { action: "link", label: "⎘ link", title: "Link (⌘K)" },
  { action: "code", label: "</>", title: "Inline code" },
]

export function EditorToolbar({
  onAction,
}: {
  onAction: (action: MarkdownAction) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5">
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          type="button"
          title={a.title}
          aria-label={a.title}
          // preventDefault so pressing a toolbar button doesn't steal focus
          // from the textarea mid-click — keeps the cursor + selection intact.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onAction(a.action)}
          className="h-6 rounded-sm px-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          style={{
            fontWeight: a.weight,
            fontStyle: a.italic ? "italic" : undefined,
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}
