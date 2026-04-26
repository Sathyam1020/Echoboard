import { cn } from "@workspace/ui/lib/utils"
import { Check, CheckCheck } from "lucide-react"

import { SupportAvatar } from "./avatar"
import type { SupportMessageRow } from "./types"

// One chat bubble. Side derives from `mine` (set by the thread component
// based on whether the bubble's author matches the viewer). Read state
// is shown only on the viewer's OWN messages — receipts go from "sent"
// (single grey ✓) to "delivered" (double grey) to "read" (double teal).

export function MessageBubble({
  message,
  mine,
  showAvatar,
}: {
  message: SupportMessageRow
  mine: boolean
  showAvatar: boolean
}) {
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        mine ? "justify-end" : "justify-start",
      )}
    >
      {!mine && showAvatar ? (
        <SupportAvatar
          name={message.author.name}
          image={message.author.image}
          className="size-7 self-end"
        />
      ) : !mine ? (
        // Spacer so consecutive bubbles align under the avatar column.
        <div className="size-7 shrink-0" aria-hidden />
      ) : null}

      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1",
          mine ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl border px-3 py-2 text-[14px] leading-relaxed whitespace-pre-wrap break-words",
            mine
              ? "rounded-br-md border-primary bg-primary text-primary-foreground"
              : "rounded-bl-md border-border bg-card text-foreground",
          )}
        >
          {message.body}
        </div>
        <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          {showAvatar && !mine ? (
            <span className="font-medium text-foreground/70">
              {message.author.name}
            </span>
          ) : null}
          <time dateTime={message.createdAt}>
            {formatTime(message.createdAt)}
          </time>
          {mine ? <ReadTick message={message} /> : null}
        </div>
      </div>
    </div>
  )
}

function ReadTick({ message }: { message: SupportMessageRow }) {
  if (message.readAt) {
    return (
      <CheckCheck
        className="size-3 text-teal-500"
        aria-label="Read"
      />
    )
  }
  if (message.deliveredAt) {
    return (
      <CheckCheck
        className="size-3 text-muted-foreground/70"
        aria-label="Delivered"
      />
    )
  }
  return <Check className="size-3 text-muted-foreground/70" aria-label="Sent" />
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
