import type { Server } from "node:http"

import { createApp } from "./app.js"
import { env } from "./config/env.js"
import { logger } from "./lib/logger.js"

const app = createApp()

const server: Server = app.listen(env.PORT, () => {
  logger.info(`server listening on :${env.PORT}`)
})

const SHUTDOWN_TIMEOUT_MS = 10_000

function shutdown(signal: string): void {
  logger.info({ signal }, "shutting down")

  const timer = setTimeout(() => {
    logger.error("forced exit after shutdown timeout")
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS)
  timer.unref()

  server.close((err) => {
    if (err) {
      logger.error({ err }, "error during server close")
      process.exit(1)
    }
    logger.info("server closed")
    process.exit(0)
  })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception")
  process.exit(1)
})

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled rejection")
  process.exit(1)
})
