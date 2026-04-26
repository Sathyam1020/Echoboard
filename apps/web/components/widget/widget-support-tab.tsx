"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { Check, CheckCheck, Loader2, Send, Sparkles } from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { useTeamPresence } from "@/hooks/realtime/use-team-presence"
import { useTypingIndicator } from "@/hooks/realtime/use-typing-indicator"
import { useTypingSender } from "@/hooks/realtime/use-typing-sender"
import { ApiError } from "@/lib/http/api-error"
import { setWidgetBearer, widgetHttp } from "@/lib/http/widget-axios"
import {
  setSocketBearer,
  subscribe,
} from "@/lib/realtime/socket-client"
import type { ServerMsg } from "@/lib/realtime/socket-client"
import { playSupportChime } from "@/lib/support-sound"
import type { VisitorIdentity } from "@/services/visitors"

import { ReconnectingBanner } from "@/components/support/reconnecting-banner"
import { TypingDots } from "@/components/support/typing-dots"
import type {
  SupportConversationRow,
  SupportMessageRow,
} from "@/components/support/types"

// Wraps both states of the widget Support tab — the "no conversation
// yet" empty state and the active thread. Identity gates the FIRST
// send (visitor must have email/name), then we POST /conversations to
// idempotently create or fetch the thread, then POST messages from
// the composer.
export function WidgetSupportTab({
  workspaceId,
  workspaceSlug,
  visitor,
  onIdentified,
}: {
  workspaceId: string
  workspaceSlug: string
  visitor: VisitorIdentity | null
  onIdentified: (v: VisitorIdentity) => void
}) {
  const [conversation, setConversation] =
    useState<SupportConversationRow | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [composing, setComposing] = useState(false)

  // Bootstrap: pull "my" conversation in this workspace if there is one.
  // Visitors without a session yet land here too — the endpoint just
  // returns null and we show the start screen.
  useEffect(() => {
    let cancelled = false
    if (!visitor) {
      setBootstrapped(true)
      return
    }
    widgetHttp
      .get<{ conversation: SupportConversationRow | null }>(
        "/api/support/me/conversation",
        { params: { workspaceSlug } },
      )
      .then((r) => {
        if (!cancelled) {
          setConversation(r.data.conversation)
          setBootstrapped(true)
        }
      })
      .catch(() => {
        if (!cancelled) setBootstrapped(true)
      })
    return () => {
      cancelled = true
    }
  }, [visitor, workspaceSlug])

  if (!bootstrapped) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2
          className="size-5 text-muted-foreground motion-safe:animate-spin"
          aria-hidden
        />
      </div>
    )
  }

  if (conversation) {
    return (
      <WidgetSupportThread
        conversation={conversation}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        visitorId={visitor?.id ?? null}
        onConversationUpdate={setConversation}
      />
    )
  }

  if (composing) {
    return (
      <StarterCard
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        visitor={visitor}
        onIdentified={onIdentified}
        onConversation={(c) => {
          setConversation(c)
          setComposing(false)
        }}
        onCancel={() => setComposing(false)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-5" aria-hidden />
      </div>
      <div className="text-[14px] font-medium">Need help?</div>
      <p className="text-[12.5px] text-muted-foreground">
        Send our team a message — we'll get back to you here.
      </p>
      <Button type="button" size="sm" onClick={() => setComposing(true)}>
        Start a conversation
      </Button>
    </div>
  )
}

// ── Starter (first-message form, doubles as the identity gate) ─────

function StarterCard({
  workspaceId,
  workspaceSlug,
  visitor,
  onIdentified,
  onConversation,
  onCancel,
}: {
  workspaceId: string
  workspaceSlug: string
  visitor: VisitorIdentity | null
  onIdentified: (v: VisitorIdentity) => void
  onConversation: (c: SupportConversationRow) => void
  onCancel: () => void
}) {
  const [body, setBody] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const needIdentity = !visitor

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      let v = visitor
      if (!v) {
        const guestRes = await widgetHttp.post<{
          visitorToken: string
          visitor: VisitorIdentity
        }>("/api/visitors/guest", {
          workspaceId,
          email: email.trim(),
          name: name.trim() || undefined,
        })
        setWidgetBearer(guestRes.data.visitorToken)
        setSocketBearer(guestRes.data.visitorToken)
        v = guestRes.data.visitor
        onIdentified(v)
        if (typeof window !== "undefined" && window.parent !== window) {
          window.parent.postMessage(
            {
              type: "echoboard:visitor-token-set",
              token: guestRes.data.visitorToken,
            },
            "*",
          )
        }
      }
      const convRes = await widgetHttp.post<{
        conversation: SupportConversationRow
      }>("/api/support/conversations", { workspaceSlug })
      const conv = convRes.data.conversation
      // Send the first message.
      await widgetHttp.post(
        `/api/support/conversations/${conv.id}/messages`,
        { body: body.trim() },
      )
      onConversation(conv)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send message")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col gap-3 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ws-msg">Your message</Label>
        <Textarea
          id="ws-msg"
          required
          minLength={1}
          maxLength={4000}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter inserts a newline.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              ;(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit()
            }
          }}
          placeholder="What can we help with?"
          autoFocus
        />
      </div>
      {needIdentity ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ws-email">Your email</Label>
            <Input
              id="ws-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ws-name">Your name (optional)</Label>
            <Input
              id="ws-name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Cooper"
            />
          </div>
        </>
      ) : (
        <p className="text-[11.5px] text-muted-foreground">
          Sending as <strong>{visitor!.name ?? visitor!.email}</strong>
        </p>
      )}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="mt-auto flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending || body.trim().length === 0}
          className="flex-1"
        >
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  )
}

// ── Thread + composer ─────────────────────────────────────────────

function WidgetSupportThread({
  conversation,
  workspaceSlug,
  workspaceId,
  visitorId,
  onConversationUpdate,
}: {
  conversation: SupportConversationRow
  workspaceSlug: string
  workspaceId: string
  visitorId: string | null
  onConversationUpdate: (c: SupportConversationRow) => void
}) {
  const [messages, setMessagesRaw] = useState<SupportMessageRow[]>([])
  const isAdminTyping = useTypingIndicator({
    conversationId: conversation.id,
    selfActorId: visitorId,
  })
  const typing = useTypingSender(conversation.id)
  const teamOnline = useTeamPresence({ workspaceSlug, workspaceId })

  // Wrap setMessages to always collapse duplicate ids. React Strict Mode
  // can briefly run two WS subscriptions in dev, and a few timing windows
  // (optimistic temp + WS broadcast + POST response) can converge on the
  // same real id from multiple paths. Normalising on every write makes
  // those races invisible to the render layer.
  const setMessages = useCallback(
    (
      updater:
        | SupportMessageRow[]
        | ((prev: SupportMessageRow[]) => SupportMessageRow[]),
    ) => {
      setMessagesRaw((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : updater
        const seen = new Set<string>()
        const deduped: SupportMessageRow[] = []
        for (const m of next) {
          if (seen.has(m.id)) continue
          seen.add(m.id)
          deduped.push(m)
        }
        return deduped
      })
    },
    [],
  )
  const [oldestCursor, setOldestCursor] = useState<string | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)

  // Initial load: latest 20.
  useEffect(() => {
    let cancelled = false
    widgetHttp
      .get<{ messages: SupportMessageRow[]; nextCursor: string | null }>(
        `/api/support/conversations/${conversation.id}/messages`,
      )
      .then((r) => {
        if (cancelled) return
        // API returns chronological order already (oldest → newest).
        setMessages(r.data.messages)
        setOldestCursor(r.data.nextCursor)
        setBootstrapped(true)
      })
      .catch(() => {
        if (!cancelled) setBootstrapped(true)
      })
    return () => {
      cancelled = true
    }
  }, [conversation.id])

  // Real-time delivery via the singleton WS client.
  useEffect(() => {
    return subscribe(
      `support:conversation:${conversation.id}`,
      (event: ServerMsg) => {
        if (event.type === "message.created") {
          const msg = (event as unknown as { message: SupportMessageRow })
            .message
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          )
          // Chime on every admin reply — matches Slack / WhatsApp /
          // iMessage convention of dinging even when the conversation
          // is open. Skip on own messages (kind "visitor"); the mute
          // toggle is the user's escape valve.
          if (msg.author.kind === "user") {
            playSupportChime()
          }
        } else if (event.type === "message.read") {
          // Admin marked-read a customer message — stamp readAt on
          // every customer-authored message up to the upTo id.
          const upToId = (
            event as unknown as { readUpToMessageId: string }
          ).readUpToMessageId
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === upToId)
            if (idx < 0) return prev
            const upToCreatedAt = prev[idx]!.createdAt
            return prev.map((m) =>
              !m.readAt &&
              m.author.kind === "visitor" &&
              m.createdAt <= upToCreatedAt
                ? { ...m, readAt: new Date().toISOString() }
                : m,
            )
          })
        }
      },
    )
  }, [conversation.id])

  // Scroll-to-bottom on first load + on each new message when near bottom.
  const scrollRef = useRef<HTMLDivElement>(null)
  const wasNearBottom = useRef(true)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (wasNearBottom.current) el.scrollTop = el.scrollHeight
  }, [messages.length])
  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    wasNearBottom.current =
      el.scrollHeight - (el.scrollTop + el.clientHeight) < 80
  }

  // Mark-as-read on every new admin message (the customer is reading by
  // virtue of having the tab open). Debounced on latest-message id.
  const lastReadId = useRef<string | null>(null)
  useEffect(() => {
    if (messages.length === 0) return
    const latest = messages[messages.length - 1]!
    if (latest.id === lastReadId.current) return
    if (latest.author.kind === "visitor") return // own message
    lastReadId.current = latest.id
    widgetHttp
      .post(`/api/support/conversations/${conversation.id}/read`, {
        upToMessageId: latest.id,
      })
      .catch(() => {
        // Silent — best-effort.
      })
  }, [conversation.id, messages])

  const loadOlder = useCallback(async () => {
    if (!oldestCursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const r = await widgetHttp.get<{
        messages: SupportMessageRow[]
        nextCursor: string | null
      }>(`/api/support/conversations/${conversation.id}/messages`, {
        params: { cursor: oldestCursor },
      })
      setMessages((prev) => [...r.data.messages, ...prev])
      setOldestCursor(r.data.nextCursor)
    } finally {
      setLoadingOlder(false)
    }
  }, [conversation.id, oldestCursor, loadingOlder])

  // Send composer.
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  async function send() {
    const trimmed = draft.trim()
    if (!trimmed || sending) return
    typing.stopNow()
    setSending(true)
    // Optimistic append.
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversationId: conversation.id,
        body: trimmed,
        createdAt: new Date().toISOString(),
        readAt: null,
        deliveredAt: null,
        author: {
          id: visitorId ?? "",
          name: "You",
          kind: "visitor",
          image: null,
        },
      },
    ])
    setDraft("")
    try {
      const r = await widgetHttp.post<{ message: SupportMessageRow }>(
        `/api/support/conversations/${conversation.id}/messages`,
        { body: trimmed },
      )
      // Reconcile the optimistic row. If the WS broadcast got here
      // first, the real message is already in the list — just drop
      // the temp. Otherwise replace temp with the real row.
      setMessages((prev) => {
        const realAlreadyHere = prev.some((m) => m.id === r.data.message.id)
        if (realAlreadyHere) {
          return prev.filter((m) => m.id !== tempId)
        }
        return prev.map((m) => (m.id === tempId ? r.data.message : m))
      })
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setDraft(trimmed)
      // No toast in widget — quietly leave the draft for retry.
      void err
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  // Ack the parent that the conversation header may have updated (e.g.
  // status changed). Currently bubbles up the most recent conversation
  // we've seen — phase 6 will hook this to typing/presence.
  void onConversationUpdate
  void conversation

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ReconnectingBanner />
      {/* Presence header — small banner with a colored dot. Updates
          live via the workspace channel's presence events. */}
      <div className="flex items-center gap-2 border-b border-border-soft bg-card px-4 py-2">
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            teamOnline ? "bg-green-500" : "bg-muted-foreground/50",
          )}
        />
        <span className="text-[12px] text-muted-foreground">
          {teamOnline
            ? "Team is online"
            : "Team is offline — leave a message and they'll see it next time"}
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-4 py-4"
      >
        {oldestCursor ? (
          <div className="flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={loadOlder}
              disabled={loadingOlder}
              className="text-[11px] text-muted-foreground"
            >
              {loadingOlder ? "Loading…" : "Load older messages"}
            </Button>
          </div>
        ) : null}
        {!bootstrapped ? (
          <div className="flex justify-center pt-6">
            <Loader2
              className="size-5 text-muted-foreground motion-safe:animate-spin"
              aria-hidden
            />
          </div>
        ) : null}
        {messages.length === 0 && bootstrapped ? (
          <div className="my-auto text-center text-[12px] text-muted-foreground">
            Send a message to start the conversation.
          </div>
        ) : null}
        {messages.map((m) => {
          const mine = m.author.kind === "visitor"
          return (
            <div
              key={m.id}
              className={cn(
                "flex w-full",
                mine ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "flex max-w-[80%] flex-col gap-0.5",
                  mine ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words",
                    mine
                      ? "rounded-br-md border-primary bg-primary text-primary-foreground"
                      : "rounded-bl-md border-border bg-card text-foreground",
                  )}
                >
                  {m.body}
                </div>
                <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
                  <time>{formatTime(m.createdAt)}</time>
                  {mine ? (
                    m.readAt ? (
                      <CheckCheck
                        className="size-3 text-teal-500"
                        aria-label="Read"
                      />
                    ) : m.deliveredAt ? (
                      <CheckCheck
                        className="size-3 text-muted-foreground/70"
                        aria-label="Delivered"
                      />
                    ) : (
                      <Check
                        className="size-3 text-muted-foreground/70"
                        aria-label="Sent"
                      />
                    )
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isAdminTyping ? (
        <div className="border-t border-border-soft bg-card px-3 py-2">
          <TypingDots label="Team is typing…" />
        </div>
      ) : null}

      <div className="flex items-end gap-2 border-t border-border bg-card p-3">
        <Textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value.slice(0, 4000))
            typing.notifyKeystroke()
          }}
          onKeyDown={onKeyDown}
          onBlur={() => typing.stopNow()}
          rows={1}
          placeholder="Reply…"
          className="min-h-[36px] resize-none text-[13px]"
          disabled={sending}
        />
        <Button
          type="button"
          size="sm"
          onClick={send}
          disabled={sending || draft.trim().length === 0}
          aria-label="Send"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}
