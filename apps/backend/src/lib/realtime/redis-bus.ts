// Cross-process pub/sub for realtime support events.
//
// REDIS_URL controls the mode:
//   - set        → ioredis publisher + subscriber, every backend replica
//                  receives every published event (production mode).
//   - unset      → in-process only. Single-replica dev works fine; running
//                  two backends won't share events. Logged once on boot
//                  so we never silently degrade in production.
//
// The actual fan-out to connected WebSockets lives in ws-gateway; this
// module is the *bus*. Gateway calls `publish()` after a successful tx,
// and registers an `onMessage()` callback that the bus invokes whenever
// an event arrives (whether from local-loopback or redis).

import { Redis } from "ioredis"

import { logger } from "../logger.js"

import type { ServerMsg } from "./events.js"

type Listener = (channel: string, event: ServerMsg) => void

const listeners = new Set<Listener>()

let publishImpl: (channel: string, event: ServerMsg) => Promise<void>
let mode: "redis" | "in-process" = "in-process"
let started = false

export function isStarted(): boolean {
  return started
}

export function getMode(): "redis" | "in-process" {
  return mode
}

export async function startRedisBus(redisUrl: string | undefined): Promise<void> {
  if (started) return
  started = true

  if (!redisUrl) {
    mode = "in-process"
    publishImpl = async (channel, event) => {
      // Dispatch locally — no cross-process delivery.
      for (const l of listeners) l(channel, event)
    }
    logger.warn(
      "REDIS_URL is unset — realtime fan-out is in-process only. Multiple backend replicas will NOT share events.",
    )
    return
  }

  const publisher = new Redis(redisUrl, { lazyConnect: true })
  const subscriber = new Redis(redisUrl, { lazyConnect: true })

  publisher.on("error", (err) =>
    logger.error({ err }, "redis publisher error"),
  )
  subscriber.on("error", (err) =>
    logger.error({ err }, "redis subscriber error"),
  )

  await Promise.all([publisher.connect(), subscriber.connect()])

  // Single global pattern subscription — covers every support: channel.
  // Cheaper than tracking which channels we're publishing on (and still
  // gates by the in-process listeners which only care about channels
  // they have local subscribers for).
  await subscriber.psubscribe("support:*")

  subscriber.on("pmessage", (_pattern, channel, raw) => {
    let event: ServerMsg
    try {
      event = JSON.parse(raw) as ServerMsg
    } catch (err) {
      logger.warn({ err, raw }, "dropped malformed redis event")
      return
    }
    for (const l of listeners) l(channel, event)
  })

  publishImpl = async (channel, event) => {
    await publisher.publish(channel, JSON.stringify(event))
  }
  mode = "redis"

  logger.info("redis bus connected, pattern-subscribed to support:*")
}

export function publish(channel: string, event: ServerMsg): Promise<void> {
  if (!publishImpl) {
    // Not yet started (start happens on server boot). Fall back to local
    // delivery so test suites that skip startRedisBus still work.
    for (const l of listeners) l(channel, event)
    return Promise.resolve()
  }
  return publishImpl(channel, event)
}

export function onMessage(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
