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
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      // Better Auth has its own per-endpoint rate limiting on /api/auth/*;
      // skip the global limiter there to avoid double-counting and to keep
      // auth throttles coherent across nodes.
      skip: (req) => req.path.startsWith("/api/auth/"),
    }),
  )

  app.use("/", apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
