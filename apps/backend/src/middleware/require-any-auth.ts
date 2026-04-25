import { auth } from "@workspace/auth/server"
import { fromNodeHeaders } from "better-auth/node"
import type { NextFunction, Request, Response } from "express"

import { loadVisitorBySession } from "../lib/visitor-session.js"
import { AppError } from "./error-handler.js"
import { readVisitorToken } from "./require-visitor.js"

// Accepts either an admin Better Auth session OR a visitor token.
// Visitor token wins when both are present — the explicit "I'm acting as a
// visitor on this workspace" path. Admin session is the fallback for the
// dashboard / owner-of-this-workspace contexts where there's no visitor token.
export async function requireAnyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const visitorToken = readVisitorToken(req)
    if (visitorToken) {
      const session = await loadVisitorBySession(visitorToken)
      if (session) {
        res.locals.visitor = session.visitor
        next()
        return
      }
      // Stale cookie — fall through to admin session check
    }

    const adminSession = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (adminSession?.user) {
      res.locals.session = {
        user: {
          id: adminSession.user.id,
          email: adminSession.user.email,
          name: adminSession.user.name,
          image: adminSession.user.image ?? null,
        },
        sessionId: adminSession.session.id,
      }
      next()
      return
    }

    throw new AppError("Authentication required", {
      status: 401,
      code: "UNAUTHORIZED",
    })
  } catch (err) {
    next(err)
  }
}
