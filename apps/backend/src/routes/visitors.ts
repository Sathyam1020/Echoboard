import { db, eq, sql } from "@workspace/db/client"
import { comment, post, postVote, workspace } from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import rateLimit from "express-rate-limit"
import { z } from "zod"

import { verifySignedIdentify } from "../lib/hmac-identify.js"
import {
  createVisitorSession,
  deleteVisitorSession,
  findOrCreateVisitor,
  serializeVisitor,
  VISITOR_COOKIE_NAME,
  visitorCookieOptions,
} from "../lib/visitor-session.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"
import {
  readVisitorToken,
  requireVisitor,
} from "../middleware/require-visitor.js"

export const visitorsRouter: Router = Router()

// Per-IP throttle for the public-write surfaces. Generous for legit users
// trying to fix a typo and resubmit, tight enough to deter scripted spam.
// Loosened heavily in dev — dogfooding the widget against your own dashboard
// burns through 30/hour in a single afternoon of submit-button mashing.
const isProd = process.env.NODE_ENV === "production"
const guestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProd ? 30 : 10_000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
})
const identifyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProd ? 60 : 10_000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
})

async function loadWorkspace(workspaceId: string) {
  const [ws] = await db
    .select()
    .from(workspace)
    .where(eq(workspace.id, workspaceId))
  if (!ws) {
    throw new AppError("Workspace not found", {
      status: 404,
      code: "WORKSPACE_NOT_FOUND",
    })
  }
  return ws
}

function applyVisitorCookie(
  res: Response,
  token: string,
  expiresAt: Date,
): void {
  res.cookie(VISITOR_COOKIE_NAME, token, visitorCookieOptions(expiresAt))
}

const guestBody = z.object({
  workspaceId: z.string().min(1),
  email: z.string().email(),
  name: z.string().trim().min(1).max(80).optional(),
})

visitorsRouter.post(
  "/guest",
  guestRateLimit,
  async (req: Request, res: Response) => {
    const parsed = guestBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }
    await loadWorkspace(parsed.data.workspaceId)
    const v = await findOrCreateVisitor({
      workspaceId: parsed.data.workspaceId,
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      authMethod: "guest",
    })
    const session = await createVisitorSession(v.id, 7)
    applyVisitorCookie(res, session.token, session.expiresAt)
    res.json({
      visitorToken: session.token,
      visitor: serializeVisitor(v),
    })
  },
)

// Identify accepts either:
//   (a) a signed `token` (HMAC-SHA256) — authMethod = 'secure_identify'
//   (b) raw fields {externalId, email, name, ...} — authMethod = 'identify'
//
// When the workspace has `requireSignedIdentify=true`, mode (b) is rejected.
const identifyBody = z
  .object({
    workspaceId: z.string().min(1),
    token: z.string().min(1).optional(),
    externalId: z.string().min(1).optional(),
    email: z.string().email().optional(),
    name: z.string().trim().min(1).max(80).optional(),
    avatarUrl: z.string().url().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => d.token || d.externalId || d.email, {
    message: "Provide a signed token, externalId, or email",
  })

visitorsRouter.post(
  "/identify",
  identifyRateLimit,
  async (req: Request, res: Response) => {
    const parsed = identifyBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }
    const ws = await loadWorkspace(parsed.data.workspaceId)

    if (parsed.data.token) {
      if (!ws.identifySecretKey) {
        throw new AppError("Workspace has no identify secret configured", {
          status: 500,
          code: "IDENTIFY_NOT_CONFIGURED",
        })
      }
      const payload = verifySignedIdentify(
        parsed.data.token,
        ws.identifySecretKey,
      )
      const v = await findOrCreateVisitor({
        workspaceId: ws.id,
        externalId: payload.externalId,
        email: payload.email ?? null,
        name: payload.name ?? null,
        avatarUrl: payload.avatarUrl ?? null,
        metadata: payload.metadata ?? null,
        authMethod: "secure_identify",
        hmacVerified: true,
      })
      const session = await createVisitorSession(v.id, 30)
      applyVisitorCookie(res, session.token, session.expiresAt)
      res.json({
        visitorToken: session.token,
        visitor: serializeVisitor(v),
      })
      return
    }

    // Unsigned path. Reject when the workspace requires signed identity.
    if (ws.requireSignedIdentify) {
      throw new AppError(
        "This workspace requires signed identify tokens",
        { status: 401, code: "SIGNED_IDENTIFY_REQUIRED" },
      )
    }

    const v = await findOrCreateVisitor({
      workspaceId: parsed.data.workspaceId,
      externalId: parsed.data.externalId ?? null,
      email: parsed.data.email ?? null,
      name: parsed.data.name ?? null,
      avatarUrl: parsed.data.avatarUrl ?? null,
      metadata: parsed.data.metadata ?? null,
      authMethod: "identify",
    })
    const session = await createVisitorSession(v.id, 30)
    applyVisitorCookie(res, session.token, session.expiresAt)
    res.json({
      visitorToken: session.token,
      visitor: serializeVisitor(v),
    })
  },
)

const fromSessionBody = z.object({
  workspaceId: z.string().min(1),
})

visitorsRouter.post(
  "/from-session",
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = fromSessionBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }
    const ws = await loadWorkspace(parsed.data.workspaceId)
    const session = res.locals.session!

    // Workspace owner stays in the admin lane — they don't need a visitor
    // identity on their own board. Frontend short-circuits the modal flow
    // for owners based on this `isOwner: true` reply.
    if (ws.ownerId === session.user.id) {
      res.json({ visitor: null, isOwner: true })
      return
    }

    const v = await findOrCreateVisitor({
      workspaceId: ws.id,
      email: session.user.email,
      name: session.user.name,
      avatarUrl: session.user.image ?? null,
      authMethod: "echoboard_user",
    })
    const visitorSessionRow = await createVisitorSession(v.id, 30)
    applyVisitorCookie(res, visitorSessionRow.token, visitorSessionRow.expiresAt)
    res.json({
      visitorToken: visitorSessionRow.token,
      visitor: serializeVisitor(v),
      isOwner: false,
    })
  },
)

visitorsRouter.get(
  "/me",
  requireVisitor,
  async (_req: Request, res: Response) => {
    const v = res.locals.visitor!

    const [postCount] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(post)
      .where(eq(post.visitorId, v.id))
    const [voteCount] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(postVote)
      .where(eq(postVote.visitorId, v.id))
    const [commentCount] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(comment)
      .where(eq(comment.visitorId, v.id))

    res.json({
      visitor: serializeVisitor(v),
      counts: {
        posts: postCount?.c ?? 0,
        votes: voteCount?.c ?? 0,
        comments: commentCount?.c ?? 0,
      },
    })
  },
)

visitorsRouter.post("/sign-out", async (req: Request, res: Response) => {
  const token = readVisitorToken(req)
  if (token) await deleteVisitorSession(token)
  res.clearCookie(VISITOR_COOKIE_NAME, { path: "/" })
  res.json({ ok: true })
})
