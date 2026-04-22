import { auth } from "@workspace/auth/server"
import { fromNodeHeaders } from "better-auth/node"
import type { NextFunction, Request, Response } from "express"

import { AppError } from "./error-handler.js"

export type SessionUser = {
  id: string
  email: string
  name: string
  image?: string | null
}

export type AuthedSession = {
  user: SessionUser
  sessionId: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      session?: AuthedSession
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!session?.user) {
      throw new AppError("Not signed in", {
        status: 401,
        code: "UNAUTHORIZED",
      })
    }

    res.locals.session = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image ?? null,
      },
      sessionId: session.session.id,
    }

    next()
  } catch (err) {
    next(err)
  }
}
