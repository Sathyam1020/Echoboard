"use client"

import { Loader2, SearchX } from "lucide-react"

import { EmptyHint } from "@/components/common/empty-hint"
import { useSupportSearchQuery } from "@/hooks/queries/use-support-search"

import { SupportAvatar } from "./avatar"

export function SearchResults({
  query,
  onSelect,
}: {
  query: string
  onSelect: (conversationId: string, messageId: string) => void
}) {
  const search = useSupportSearchQuery(query)

  if (query.trim().length === 0) return null
  if (search.isPending) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-[13px] text-muted-foreground">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
        Searching…
      </div>
    )
  }

  const hits = search.data?.hits ?? []
  if (hits.length === 0) {
    return (
      <div className="px-4 py-10">
        <EmptyHint
          variant="inline"
          icon={SearchX}
          title="No matches"
          description={`Nothing for "${query.trim()}" — try fewer or different words.`}
        />
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {hits.map((h) => (
        <li key={h.message.id}>
          <button
            type="button"
            onClick={() => onSelect(h.conversation.id, h.message.id)}
            className="flex w-full items-start gap-3 border-b border-border-soft px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SupportAvatar
              name={h.conversation.customer.name}
              image={h.conversation.customer.image}
              className="size-8"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">
                {h.conversation.customer.name}
              </div>
              <p
                className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground [&_b]:text-foreground [&_b]:font-medium"
                // ts_headline output already wraps matches in <b>; the
                // sanitizer here is fact-of-narrowness rather than
                // safety — Postgres only emits <b> on text that came in
                // through tsvector input the user authored, but they
                // could have input HTML themselves. We HTML-escape the
                // whole highlight first then re-permit the <b> markers.
                dangerouslySetInnerHTML={{ __html: sanitizeHighlight(h.highlight) }}
              />
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

// HTML-escapes the headline string except for ts_headline's <b> markers,
// which we re-introduce after escaping. Any user-authored '<' / '>' in
// the message body becomes &lt; / &gt; and never renders as HTML.
function sanitizeHighlight(raw: string): string {
  // Replace markers with placeholders the user CAN'T have typed.
  const OPEN = "OPEN"
  const CLOSE = "CLOSE"
  const placeheld = raw
    .split("<b>")
    .join(OPEN)
    .split("</b>")
    .join(CLOSE)
  const escaped = placeheld
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  return escaped.split(OPEN).join("<b>").split(CLOSE).join("</b>")
}
