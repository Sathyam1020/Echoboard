import { auth } from "@workspace/auth/server"
import { toNodeHandler } from "better-auth/node"
import cors from "cors"
import express, { type Express } from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { pinoHttp } from "pino-http"

import { env } from "./config/env.js"
import { logger } from "./lib/logger.js"
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js"
import { apiRouter } from "./routes/index.js"

export function createApp(): Express {
  const app = express()

  app.disable("x-powered-by")
  app.set("trust proxy", 1)

  app.use(helmet())

  // Public widget surfaces — embedded on any 3rd-party SaaS site, so they
  // need permissive CORS. credentials:false because cookies don't survive
  // 3rd-party iframe contexts in modern browsers anyway; the widget uses
  // Bearer tokens for cross-origin calls.
  const widgetCors = cors({
    origin: true,
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
  app.use("/api/widget", widgetCors)
  app.use("/api/visitors/guest", widgetCors)
  app.use("/api/visitors/identify", widgetCors)
  app.use("/api/visitors/me", widgetCors)
  app.use("/api/visitors/sign-out", widgetCors)

  // Default CORS — locked to the configured origins. Carries cookies for
  // the public board (same-origin) + the dashboard.
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )

  // Better Auth handler — MUST be mounted before express.json(). Better Auth
  // parses its own request bodies; a JSON parser above it consumes the stream
  // and causes hanging requests. Express 5 dropped bare `*`, so the named
  // wildcard `*splat` is required.
  app.all("/api/auth/*splat", toNodeHandler(auth))

  app.use(express.json({ limit: "1mb" }))
  app.use(express.urlencoded({ extended: true, limit: "1mb" }))

  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error"
        if (res.statusCode >= 400) return "warn"
        return "info"
      },
    }),
  )

  // Dev SSR fans out to multiple API calls per page render and hot-reload
  // multiplies that — 100/15min gets burned in a minute of browser refreshes.
  // Keep the limiter strict in prod; loosen it for local development.
  const isProd = env.NODE_ENV === "production"
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: isProd ? 100 : 10_000,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      // Better Auth has its own per-endpoint rate limiting on /api/auth/*;
      // skip the global limiter there to avoid double-counting and to keep
      // auth throttles coherent across nodes.
      skip: (req) => req.path.startsWith("/api/auth/"),
    }),
  )

  app.use("/api", apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
