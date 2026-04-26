"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import {
  useSupportConversationQuery,
  useSupportMessagesInfiniteQuery,
} from "@/hooks/queries/use-support-messages"
import {
  useMarkConversationReadMutation,
  useSendSupportMessageMutation,
  useSetConversationStatusMutation,
} from "@/hooks/use-support-mutations"

import { useTypingIndicator } from "@/hooks/realtime/use-typing-indicator"

import { AssigneePicker } from "./assignee-picker"
import { SupportAvatar } from "./avatar"
import { Composer } from "./composer"
import { MessageBubble } from "./message-bubble"
import { StatusPill } from "./status-pill"
import { TypingDots } from "./typing-dots"
import type { ConversationStatus } from "./types"

export function ConversationThread({
  conversationId,
  onBack,
}: {
  conversationId: string
  // Mobile-only "back to list" affordance — desktop hides it via md:hidden.
  onBack?: () => void
}) {
  const convQuery = useSupportConversationQuery(conversationId)
  const msgsQuery = useSupportMessagesInfiniteQuery(conversationId)
  const { data: session } = authClient.useSession()
  const isOtherTyping = useTypingIndicator({
    conversationId,
    selfActorId: session?.user.id ?? null,
  })

  const conv = convQuery.data?.conversation
  const send = useSendSupportMessageMutation(conversationId)
  const setStatus = useSetConversationStatusMutation(
    conversationId,
    conv?.workspaceId ?? "",
  )
  const markRead = useMarkConversationReadMutation(conversationId)

  // Older-than pagination: page 0 = latest. Each page is in chronological
  // order; flattened oldest→newest by reversing the page order.
  const messages =
    msgsQuery.data?.pages
      .slice()
      .reverse()
      .flatMap((p) => p.messages) ?? []

  // ── Auto-scroll to bottom on first load + on each new message,
  //     but only if the user is already near the bottom (so reading
  //     history doesn't get hijacked).
  const scrollRef = useRef<HTMLDivElement>(null)
  const wasNearBottom = useRef(true)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (wasNearBottom.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages.length])

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    wasNearBottom.current =
      el.scrollHeight - (el.scrollTop + el.clientHeight) < 80
  }

  // ── Mark-as-read on the latest message id, debounced by id-change.
  const lastReadMessageId = useRef<string | null>(null)
  useEffect(() => {
    if (messages.length === 0) return
    const latest = messages[messages.length - 1]!
    if (latest.id === lastReadMessageId.current) return
    if (latest.author.kind === "user") {
      // Already authored by an admin (us) — no need to mark.
      return
    }
    lastReadMessageId.current = latest.id
    markRead.mutate(latest.id)
  }, [messages, markRead])

  if (!conv || convQuery.isPending) {
    return <ThreadSkeleton />
  }

  const myUserId = session?.user.id ?? ""

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3 sm:px-5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="-ml-1 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
        ) : null}
        <SupportAvatar
          name={conv.customer.name}
          image={conv.customer.image}
          className="size-10"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium">
            {conv.customer.name}
          </div>
          <div className="text-[12px] text-muted-foreground">
            {conv.customer.kind === "visitor"
              ? "Visitor"
              : "Customer (account)"}
          </div>
        </div>
        <StatusActions
          status={conv.status}
          onChange={(s) => setStatus.mutate(s)}
          pending={setStatus.isPending}
        />
        <AssigneePicker
          conversationId={conv.id}
          workspaceId={conv.workspaceId}
          current={conv.assignedTo}
        />
      </div>

      {/* Scroll body */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-5 py-4"
      >
        {/* Older-messages sentinel at the TOP — scrolling up loads more.
            Empty endLabel hides the "You've reached the end." copy when
            we hit the start of the conversation (it's the start, not
            the end). */}
        <InfiniteScrollSentinel
          onLoadMore={() => msgsQuery.fetchNextPage()}
          hasNextPage={!!msgsQuery.hasNextPage}
          isFetchingNextPage={msgsQuery.isFetchingNextPage}
          endLabel=""
        />
        {messages.length === 0 && !msgsQuery.isPending ? (
          <div className="my-auto text-center text-[12.5px] text-muted-foreground">
            No messages yet — say hi.
          </div>
        ) : null}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          // Show the avatar only when the author changes (top of a run).
          const showAvatar = !prev || prev.author.id !== m.author.id
          const mine = m.author.kind === "user" && m.author.id === myUserId
          return (
            <MessageBubble
              key={m.id}
              message={m}
              mine={mine}
              showAvatar={showAvatar}
            />
          )
        })}
      </div>

      {isOtherTyping ? (
        <div className="border-t border-border-soft bg-card px-5 py-2">
          <TypingDots
            label={`${conv.customer.name.split(" ")[0]} is typing…`}
          />
        </div>
      ) : null}

      <Composer
        conversationId={conversationId}
        onSend={async (body) => {
          await send.mutateAsync(body)
        }}
        autoFocus
      />
    </div>
  )
}

function StatusActions({
  status,
  onChange,
  pending,
}: {
  status: ConversationStatus
  onChange: (s: ConversationStatus) => void
  pending: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={pending}
          aria-label="Change conversation status"
        >
          <StatusPill status={status} />
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(["open", "pending", "resolved"] as ConversationStatus[]).map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => onChange(s)}
            disabled={s === status}
            className="capitalize"
          >
            {s === "resolved"
              ? "Mark resolved"
              : s === "pending"
                ? "Mark pending"
                : "Re-open"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThreadSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
        <div className="size-10 rounded-full bg-muted/60 motion-safe:animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 rounded bg-muted/60 motion-safe:animate-pulse" />
          <div className="h-3 w-20 rounded bg-muted/40 motion-safe:animate-pulse" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={i % 2 ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                "h-10 w-1/2 rounded-2xl bg-muted/40 motion-safe:animate-pulse"
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
