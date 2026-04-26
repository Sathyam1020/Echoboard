// WebSocket gateway. Attaches to the same HTTP server Express runs on
// (via `server.upgrade`), authenticates each upgrade against either a
// Better Auth session cookie OR a visitor cookie/Bearer token, and
// multiplexes inbound subscribe/unsubscribe messages onto a per-channel
// in-process registry. Outbound delivery comes from redis-bus's
// onMessage hook — every backend replica receives every published event.

import { auth } from "@workspace/auth/server"
import type { IncomingMessage, Server as HttpServer } from "node:http"
import type { Duplex } from "node:stream"
import { WebSocket, WebSocketServer } from "ws"

import {
  loadVisitorBySession,
  VISITOR_COOKIE_NAME,
} from "../visitor-session.js"
import { logger } from "../logger.js"

import {
  canSubscribe,
  channelFor,
  parseChannel,
  type Actor,
} from "./channels.js"
import type { ClientMsg, ServerMsg } from "./events.js"
import { addPresence, onPresenceChange, removePresence } from "./presence.js"
import { publish, onMessage as onBusMessage } from "./redis-bus.js"

// Attaches the upgrade handler. Call once on server boot.
export function attachWsGateway(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true })

  // ── Subscriber registry ──────────────────────────────────────────
  // Map channel → set of (socket → actor). We track the actor with the
  // socket so re-auth on reconnect is implicit (the upgrade re-runs).
  const subscribers = new Map<string, Map<WebSocket, Actor>>()

  function addSub(channel: string, ws: WebSocket, actor: Actor): void {
    let set = subscribers.get(channel)
    if (!set) {
      set = new Map()
      subscribers.set(channel, set)
    }
    set.set(ws, actor)
  }

  function removeSub(channel: string, ws: WebSocket): void {
    const set = subscribers.get(channel)
    if (!set) return
    set.delete(ws)
    if (set.size === 0) subscribers.delete(channel)
  }

  function removeAllSubsFor(ws: WebSocket): void {
    for (const [channel, set] of subscribers) {
      if (set.has(ws)) {
        set.delete(ws)
        if (set.size === 0) subscribers.delete(channel)
      }
    }
  }

  // ── Inbound from redis-bus → fan out to local sockets ────────────
  onBusMessage((channel, event) => {
    const set = subscribers.get(channel)
    if (!set) return
    const payload = JSON.stringify(event)
    for (const sock of set.keys()) {
      if (sock.readyState === WebSocket.OPEN) sock.send(payload)
    }
  })

  // Bridge presence changes onto the workspace channel so anyone
  // subscribed (admin sidebars, widget thread headers) gets a live
  // online/offline indicator without polling.
  onPresenceChange(({ workspaceId, userId, status }) => {
    void publish(channelFor.workspace(workspaceId), {
      type: "presence",
      userId,
      status,
    })
  })

  // ── Heartbeat sweep ──────────────────────────────────────────────
  // Drop sockets that haven't replied to a ping in 60s.
  const HEARTBEAT_MS = 25_000
  const sweep = setInterval(() => {
    for (const ws of wss.clients) {
      const w = ws as WebSocket & { isAlive?: boolean }
      if (w.isAlive === false) {
        w.terminate()
        removeAllSubsFor(ws)
        continue
      }
      w.isAlive = false
      w.ping()
    }
  }, HEARTBEAT_MS)

  wss.on("close", () => clearInterval(sweep))

  // ── Upgrade handler ──────────────────────────────────────────────
  server.on("upgrade", (req, socket, head) => {
    // We only own /ws — everything else (better-auth might use ws too
    // someday) falls through.
    const url = req.url ?? ""
    if (!url.startsWith("/ws")) return

    void authenticateUpgrade(req)
      .then((actor) => {
        if (!actor) {
          rejectUpgrade(socket, 401, "Unauthorized")
          return
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          attachSocket(ws, actor)
        })
      })
      .catch((err) => {
        logger.error({ err }, "ws upgrade auth failed")
        rejectUpgrade(socket, 500, "Internal error")
      })
  })

  // Per-user open-socket counter so presence stays "online" until the
  // LAST socket for a user closes (the same admin can have two
  // dashboard tabs open and shouldn't drop offline when one closes).
  const userSocketCount = new Map<string, number>()

  function attachSocket(ws: WebSocket, actor: Actor): void {
    const w = ws as WebSocket & { isAlive?: boolean }
    w.isAlive = true

    if (actor.kind === "user") {
      const next = (userSocketCount.get(actor.userId) ?? 0) + 1
      userSocketCount.set(actor.userId, next)
      if (next === 1) {
        void addPresence(actor.userId).catch((err) =>
          logger.error({ err }, "addPresence failed"),
        )
      }
    }

    ws.on("pong", () => {
      w.isAlive = true
    })

    ws.on("message", (raw) => {
      let msg: ClientMsg
      try {
        msg = JSON.parse(raw.toString()) as ClientMsg
      } catch {
        return
      }
      void handleClientMessage(ws, actor, msg).catch((err) => {
        logger.error({ err, msg }, "ws message handler failed")
      })
    })

    ws.on("close", () => {
      removeAllSubsFor(ws)
      if (actor.kind === "user") {
        const next = (userSocketCount.get(actor.userId) ?? 1) - 1
        if (next <= 0) {
          userSocketCount.delete(actor.userId)
          void removePresence(actor.userId).catch((err) =>
            logger.error({ err }, "removePresence failed"),
          )
        } else {
          userSocketCount.set(actor.userId, next)
        }
      }
    })
  }

  async function handleClientMessage(
    ws: WebSocket,
    actor: Actor,
    msg: ClientMsg,
  ): Promise<void> {
    switch (msg.type) {
      case "ping":
        send(ws, { type: "pong" })
        return

      case "subscribe": {
        const channels = Array.isArray(msg.channels) ? msg.channels : []
        // Validate each channel against the actor; ack per channel so
        // the client can render a per-channel error if one is rejected.
        await Promise.all(
          channels.map(async (name) => {
            const parsed = parseChannel(name)
            if (!parsed) {
              send(ws, {
                type: "subscribe-error",
                channel: name,
                reason: "invalid-channel",
              })
              return
            }
            const allowed = await canSubscribe(actor, parsed)
            if (!allowed) {
              send(ws, {
                type: "subscribe-error",
                channel: name,
                reason: "forbidden",
              })
              return
            }
            addSub(name, ws, actor)
            send(ws, { type: "subscribed", channel: name })
          }),
        )
        return
      }

      case "unsubscribe": {
        const channels = Array.isArray(msg.channels) ? msg.channels : []
        for (const name of channels) removeSub(name, ws)
        return
      }

      case "typing": {
        // Server-side hard cap: 5 typing events per second per socket.
        // Composer-side throttle is the primary defense; this is the
        // belt against a misbehaving / hostile client.
        const w = ws as WebSocket & { typingBudget?: number[] }
        const now = Date.now()
        const recent = (w.typingBudget ?? []).filter((t) => now - t < 1000)
        if (recent.length >= 5) {
          w.typingBudget = recent
          return
        }
        recent.push(now)
        w.typingBudget = recent

        // Validate that the actor is a participant of the conversation.
        const conversationChannel = channelFor.conversation(
          msg.conversationId,
        )
        const allowed = await canSubscribe(
          actor,
          parseChannel(conversationChannel),
        )
        if (!allowed) return

        // Fan out via the same bus the message events use. Listeners
        // dedupe self-fired typing on the client so the typer doesn't
        // see their own dots.
        await publish(conversationChannel, {
          type: "typing",
          conversationId: msg.conversationId,
          actorId:
            actor.kind === "user" ? actor.userId : actor.visitorId,
          actorKind: actor.kind,
          isTyping: msg.isTyping,
        })
        return
      }

      // Presence is phase 6's second deliverable — wire-format reserved,
      // implementation lands in a follow-up commit alongside the Redis
      // SADD presence set.
      case "presence":
        return
    }
  }

  function send(ws: WebSocket, event: ServerMsg): void {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event))
  }
}

// Authenticates an upgrade request. Returns the resolved actor or null.
//
// Resolution order:
//   1. If `?token=` is present → visitor identity (the explicit signal
//      that the caller wants visitor mode). MUST come first because the
//      same browser may also have a Better Auth session cookie if the
//      widget iframe is same-origin with the dashboard — cookies would
//      otherwise win and the connection would be misidentified as the
//      logged-in user instead of the visitor.
//   2. Better Auth session cookie → user (admin) identity.
//   3. Legacy visitor cookie → visitor identity (covers same-origin
//      embeds that haven't switched to the Bearer/token flow).
async function authenticateUpgrade(
  req: IncomingMessage,
): Promise<Actor | null> {
  const queryToken = readVisitorTokenFromQuery(req)
  if (queryToken) {
    const visitorSession = await loadVisitorBySession(queryToken)
    if (!visitorSession) return null
    return { kind: "visitor", visitorId: visitorSession.visitor.id }
  }

  try {
    const session = await auth.api.getSession({
      headers: nodeHeadersToFetchHeaders(req),
    })
    if (session?.user?.id) {
      return { kind: "user", userId: session.user.id }
    }
  } catch {
    // Fall through to visitor cookie.
  }

  const cookieToken = readVisitorTokenFromRaw(req)
  if (!cookieToken) return null
  const visitorSession = await loadVisitorBySession(cookieToken)
  if (!visitorSession) return null
  return { kind: "visitor", visitorId: visitorSession.visitor.id }
}

function readVisitorTokenFromQuery(req: IncomingMessage): string | null {
  const url = req.url ?? ""
  const q = url.indexOf("?")
  if (q < 0) return null
  const params = new URLSearchParams(url.slice(q + 1))
  const t = params.get("token")
  return t && t.length > 0 ? t : null
}

function readVisitorTokenFromRaw(req: IncomingMessage): string | null {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null
  const match = cookieHeader.match(
    new RegExp(`(?:^|; )${VISITOR_COOKIE_NAME}=([^;]+)`),
  )
  if (!match) return null
  const raw = match[1]!
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function nodeHeadersToFetchHeaders(req: IncomingMessage): Headers {
  const h = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) h.append(key, v)
    } else if (typeof value === "string") {
      h.set(key, value)
    }
  }
  return h
}

function rejectUpgrade(socket: Duplex, code: number, message: string): void {
  socket.write(
    `HTTP/1.1 ${code} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  )
  socket.destroy()
}
