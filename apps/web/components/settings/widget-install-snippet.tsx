"use client"

import { Button } from "@workspace/ui/components/button"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

export function WidgetInstallSnippet({
  boardId,
  origin,
}: {
  boardId: string
  origin: string
}) {
  const [copied, setCopied] = useState(false)

  const snippet = `<script
  src="${origin}/widget.js"
  data-board-id="${boardId}"
  async
></script>`

  async function copy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12.5px] text-muted-foreground">
        Drop this anywhere in your site's <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">&lt;head&gt;</code>
        — the script self-bootstraps a floating button that opens the widget panel.
      </p>
      <div className="relative">
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-[12px] leading-[1.6]">
          <code>{snippet}</code>
        </pre>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copy}
          className="absolute right-2 top-2 h-7 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="size-3.5" aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden /> Copy
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
