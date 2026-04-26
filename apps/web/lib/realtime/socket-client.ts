// Singleton WebSocket client for the support realtime channel. One
// connection per browser tab; consumers (admin support page, widget
// support tab) subscribe/unsubscribe via channel names.
//
// Reconnect with exponential backoff. Each reconnect re-issues
// `subscribe` for every channel that has a local listener — listeners
// don't have to re-bind across reconnects.

"use client"

// Mirrors apps/backend/src/lib/realtime/events.ts. Kept inline so the
// frontend doesn't reach into the backend package — the wire format
// is the contract; if it diverges, the runtime will tell us loudly.

export type ServerMsg =
  | { type: "pong" }
  | { type: "subscribed"; channel: string }
  | {
      type: "subscribe-error"
      channel: string
      reason: "forbidden" | "invalid-channel"
    }
  | { type: string; [key: string]: unknown }

export type Listener = (event: ServerMsg) => void

export type ConnectionState =
  | "connecting"
  | "open"
  | "reconnecting"
  | "closed"

type StateListener = (state: ConnectionState) => void

const channelListeners = new Map<string, Set<Listener>>()
const stateListeners = new Set<StateListener>()
const subscribed = new Set<string>()

let socket: WebSocket | null = null
let connectionState: ConnectionState = "closed"
let reconnectAttempts = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const BACKOFF_MS = [500, 1000, 2000, 5000, 10_000, 30_000] as const

function backoff(): number {
  const idx = Math.min(reconnectAttempts, BACKOFF_MS.length - 1)
  return BACKOFF_MS[idx]!
}

function setState(next: ConnectionState): void {
  if (connectionState === next) return
  connectionState = next
  for (const l of stateListeners) l(next)
}

function resolveWsUrl(): string {
  // Prefer NEXT_PUBLIC_WS_URL when set; fall back to deriving from the
  // backend HTTP URL (http → ws, https → wss). Both are exposed at
  // build time as Next.js public env vars.
  const explicit = process.env.NEXT_PUBLIC_WS_URL
  if (explicit) return `${explicit.replace(/\/$/, "")}/ws`
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backend) {
    throw new Error(
      "NEXT_PUBLIC_BACKEND_URL or NEXT_PUBLIC_WS_URL must be set to open a WebSocket.",
    )
  }
  return `${backend.replace(/^http/, "ws").replace(/\/$/, "")}/ws`
}

function open(): void {
  if (typeof window === "undefined") return
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }
  setState(reconnectAttempts === 0 ? "connecting" : "reconnecting")

  let ws: WebSocket
  try {
    ws = new WebSocket(resolveWsUrl())
  } catch {
    scheduleReconnect()
    return
  }
  socket = ws

  ws.addEventListener("open", () => {
    reconnectAttempts = 0
    setState("open")
    // Re-subscribe to every channel a listener still cares about.
    if (subscribed.size > 0) {
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channels: Array.from(subscribed),
        }),
      )
    }
  })

  ws.addEventListener("message", (e) => {
    let event: ServerMsg
    try {
      event = JSON.parse(e.data) as ServerMsg
    } catch {
      return
    }
    // Dispatch to channel-scoped listeners. The backend doesn't include
    // a channel field in payloads; we route by event type → channel.
    for (const channel of channelListenersToHit(event)) {
      const set = channelListeners.get(channel)
      if (!set) continue
      for (const l of set) l(event)
    }
  })

  ws.addEventListener("close", () => {
    socket = null
    if (channelListeners.size === 0) {
      // No subscribers want a connection — stay closed.
      setState("closed")
      return
    }
    scheduleReconnect()
  })

  ws.addEventListener("error", () => {
    // Browser will follow up with `close` — let that handler retry.
  })
}

function scheduleReconnect(): void {
  if (reconnectTimer) return
  setState("reconnecting")
  const delay = backoff()
  reconnectAttempts++
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    open()
  }, delay)
}

function close(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (socket) socket.close()
  socket = null
  setState("closed")
}

// The backend's events don't carry a channel name in the payload — they
// flow over the WS already routed. So routing here is by event TYPE +
// the conversation/workspace id embedded in the payload.
function channelListenersToHit(event: ServerMsg): string[] {
  const t = event.type
  if (t === "pong" || t === "subscribed" || t === "subscribe-error") {
    // Lifecycle events — broadcast to every listener so consumers can
    // observe connection-level state if they care.
    return Array.from(channelListeners.keys())
  }
  // Routed by the id baked into the event. The exact field set varies
  // by event type — read everything as a generic bag rather than
  // narrowing the discriminated union on every branch.
  const bag = event as unknown as Record<string, unknown>
  const conversationId =
    typeof bag.conversationId === "string" ? bag.conversationId : null
  const conversation = bag.conversation as
    | { workspaceId?: string }
    | undefined
  const workspaceId =
    typeof conversation?.workspaceId === "string"
      ? conversation.workspaceId
      : null
  const userId = typeof bag.userId === "string" ? bag.userId : null

  const targets: string[] = []
  if (conversationId)
    targets.push(`support:conversation:${conversationId}`)
  if (workspaceId) targets.push(`support:workspace:${workspaceId}`)
  if (userId) targets.push(`support:user:${userId}`)
  return targets
}

// ── Public API ────────────────────────────────────────────────────

export function subscribe(channel: string, listener: Listener): () => void {
  let set = channelListeners.get(channel)
  if (!set) {
    set = new Set()
    channelListeners.set(channel, set)
  }
  set.add(listener)

  // Open the connection on the first subscriber, send subscribe frame
  // (or batch into the open handler if we're still connecting).
  const first = subscribed.size === 0
  if (!subscribed.has(channel)) {
    subscribed.add(channel)
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "subscribe", channels: [channel] }))
    }
  }
  if (first || !socket) open()

  return () => {
    const s = channelListeners.get(channel)
    if (!s) return
    s.delete(listener)
    if (s.size === 0) {
      channelListeners.delete(channel)
      subscribed.delete(channel)
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({ type: "unsubscribe", channels: [channel] }),
        )
      }
      if (channelListeners.size === 0) close()
    }
  }
}

export function onConnectionState(listener: StateListener): () => void {
  stateListeners.add(listener)
  // Fire current state immediately so consumers can render correctly.
  listener(connectionState)
  return () => {
    stateListeners.delete(listener)
  }
}

export function getConnectionState(): ConnectionState {
  return connectionState
}
