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
  parseChannel,
  type Actor,
} from "./channels.js"
import type { ClientMsg, ServerMsg } from "./events.js"
import { onMessage as onBusMessage } from "./redis-bus.js"

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

  function attachSocket(ws: WebSocket, actor: Actor): void {
    const w = ws as WebSocket & { isAlive?: boolean }
    w.isAlive = true

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

      // typing + presence are wired in phase 6. Accept the events on
      // the wire today so clients can ship without protocol churn,
      // but no-op them for now.
      case "typing":
      case "presence":
        return
    }
  }

  function send(ws: WebSocket, event: ServerMsg): void {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event))
  }
}

// Authenticates an upgrade request. Returns the resolved actor or null.
async function authenticateUpgrade(
  req: IncomingMessage,
): Promise<Actor | null> {
  // Try Better Auth first (admin path).
  try {
    const session = await auth.api.getSession({
      headers: nodeHeadersToFetchHeaders(req),
    })
    if (session?.user?.id) {
      return { kind: "user", userId: session.user.id }
    }
  } catch {
    // Fall through to visitor path.
  }

  // Fall back to the visitor cookie.
  const token = readVisitorTokenFromRaw(req)
  if (!token) return null
  const visitorSession = await loadVisitorBySession(token)
  if (!visitorSession) return null
  return { kind: "visitor", visitorId: visitorSession.visitor.id }
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
