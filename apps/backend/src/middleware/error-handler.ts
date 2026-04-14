import type { NextFunction, Request, Response } from "express"

import { env } from "../config/env.js"
import { logger } from "../lib/logger.js"

export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly expose: boolean

  constructor(
    message: string,
    options: { status?: number; code?: string; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = "AppError"
    this.status = options.status ?? 500
    this.code = options.code ?? "INTERNAL_ERROR"
    this.expose = this.status < 500
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  })
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isAppError = err instanceof AppError
  const status = isAppError ? err.status : 500
  const code = isAppError ? err.code : "INTERNAL_ERROR"
  const message =
    isAppError && err.expose
      ? err.message
      : status >= 500
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : "Request failed"

  req.log?.error({ err, status, code }, "request failed")
  if (!req.log) logger.error({ err, status, code }, "request failed")

  const body: Record<string, unknown> = { error: { code, message } }
  if (env.NODE_ENV !== "production" && err instanceof Error) {
    body.error = { ...(body.error as object), stack: err.stack }
  }

  res.status(status).json(body)
}
