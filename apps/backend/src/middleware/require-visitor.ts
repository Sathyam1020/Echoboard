import type { NextFunction, Request, Response } from "express"

import {
  loadVisitorBySession,
  VISITOR_COOKIE_NAME,
  type VisitorRow,
} from "../lib/visitor-session.js"
import { AppError } from "./error-handler.js"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      visitor?: VisitorRow
    }
  }
}

// Reads the visitor token from cookie OR Authorization Bearer header.
// Cookie wins on the public board (same-origin); Bearer is the widget path
// (cross-origin from a host SaaS site → cookies blocked by Safari ITP etc).
export function readVisitorToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const match = cookieHeader.match(
      new RegExp(`(?:^|; )${VISITOR_COOKIE_NAME}=([^;]+)`),
    )
    if (match) {
      const raw = match[1]!
      try {
        return decodeURIComponent(raw)
      } catch {
        return raw
      }
    }
  }
  const auth = req.headers.authorization
  if (auth?.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length).trim()
  }
  return null
}

export async function requireVisitor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = readVisitorToken(req)
    if (!token) {
      throw new AppError("Visitor token required", {
        status: 401,
        code: "VISITOR_REQUIRED",
      })
    }
    const session = await loadVisitorBySession(token)
    if (!session) {
      throw new AppError("Visitor session expired", {
        status: 401,
        code: "VISITOR_SESSION_EXPIRED",
      })
    }
    res.locals.visitor = session.visitor
    next()
  } catch (err) {
    next(err)
  }
}
