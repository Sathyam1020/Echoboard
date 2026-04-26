"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Inbox } from "lucide-react"

import { EmptyHint } from "@/components/common/empty-hint"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { useSupportConversationsInfiniteQuery } from "@/hooks/queries/use-support-conversations"

import { SupportAvatar } from "./avatar"
import { StatusPill } from "./status-pill"
import type { ConversationStatus, SupportConversationRow } from "./types"

export function ConversationList({
  filter,
  activeId,
  onSelect,
}: {
  filter: { status?: ConversationStatus; mine?: boolean }
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const query = useSupportConversationsInfiniteQuery(filter)

  const conversations =
    query.data?.pages.flatMap((p) => p.conversations) ?? []

  if (query.isPending && conversations.length === 0) {
    return <ConversationListSkeleton />
  }

  if (conversations.length === 0) {
    return (
      <div className="px-4 py-10">
        <EmptyHint
          variant="inline"
          icon={Inbox}
          title="No conversations yet"
          description="When a customer messages your team, the thread will appear here."
        />
      </div>
    )
  }

  return (
    <ul className="flex flex-col">
      {conversations.map((c) => (
        <li key={c.id}>
          <ConversationRow
            conversation={c}
            active={c.id === activeId}
            onSelect={() => onSelect(c.id)}
          />
        </li>
      ))}
      <li>
        <InfiniteScrollSentinel
          onLoadMore={() => query.fetchNextPage()}
          hasNextPage={!!query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
        />
      </li>
    </ul>
  )
}

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: SupportConversationRow
  active: boolean
  onSelect: () => void
}) {
  const c = conversation
  const preview = c.lastMessage?.body ?? "No messages yet"
  const unread = c.unreadAdmin > 0

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border-soft px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-muted",
      )}
    >
      <SupportAvatar
        name={c.customer.name}
        image={c.customer.image}
        className="size-9"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "min-w-0 truncate text-[13.5px]",
              unread ? "font-medium" : "font-normal",
            )}
          >
            {c.customer.name}
          </span>
          <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatRelative(c.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p
            className={cn(
              "min-w-0 truncate text-[12.5px]",
              unread
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <StatusPill status={c.status} />
          {c.assignedTo ? (
            <SupportAvatar
              name={c.assignedTo.name}
              image={c.assignedTo.image}
              className="size-4"
            />
          ) : null}
          {unread ? (
            <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] tabular-nums text-primary-foreground">
              {c.unreadAdmin}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function ConversationListSkeleton() {
  return (
    <ul className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="flex items-start gap-3 border-b border-border-soft px-4 py-3"
        >
          <div className="size-9 rounded-full bg-muted/60 motion-safe:animate-pulse" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-muted/60 motion-safe:animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted/40 motion-safe:animate-pulse" />
            <div className="h-3 w-1/4 rounded bg-muted/40 motion-safe:animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60_000)
  if (m < 1) return "now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}
