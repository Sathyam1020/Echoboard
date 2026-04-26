import { randomUUID } from "node:crypto"

import { and, db, eq, isNull } from "@workspace/db/client"
import {
  user,
  workspace,
  workspaceInvite,
  workspaceMember,
} from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import { env } from "../config/env.js"
import { sendEmail } from "../lib/email/resend.js"
import {
  inviteEmailHtml,
  inviteEmailText,
} from "../lib/email/templates/invite-email.js"
import {
  buildInviteToken,
  decodeInviteToken,
  verifyInviteSignature,
} from "../lib/invite-tokens.js"
import {
  requireWorkspaceMember,
  setActiveWorkspaceCookie,
  type WorkspaceRole,
} from "../lib/workspace-context.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"

export const teamRouter: Router = Router()

const INVITE_TTL_DAYS = 7

const inviteBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["admin", "member"]),
})

const roleBody = z.object({
  role: z.enum(["admin", "member"]),
})

// ── List members + pending invites ────────────────────────────

teamRouter.get(
  "/members",
  requireAuth,
  requireWorkspaceMember(),
  async (_req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!
    const rows = await db
      .select({
        membershipId: workspaceMember.id,
        role: workspaceMember.role,
        joinedAt: workspaceMember.createdAt,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(eq(workspaceMember.workspaceId, ctx.workspace.id))
      .orderBy(workspaceMember.createdAt)

    res.json({
      members: rows.map((r) => ({
        membershipId: r.membershipId,
        role: r.role,
        joinedAt: r.joinedAt.toISOString(),
        user: {
          id: r.userId,
          name: r.userName,
          email: r.userEmail,
          image: r.userImage ?? null,
        },
      })),
    })
  },
)

teamRouter.get(
  "/invites",
  requireAuth,
  requireWorkspaceMember("admin"),
  async (_req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!
    const rows = await db
      .select({
        id: workspaceInvite.id,
        email: workspaceInvite.email,
        role: workspaceInvite.role,
        expiresAt: workspaceInvite.expiresAt,
        createdAt: workspaceInvite.createdAt,
        invitedById: workspaceInvite.invitedByUserId,
        invitedByName: user.name,
      })
      .from(workspaceInvite)
      .innerJoin(user, eq(user.id, workspaceInvite.invitedByUserId))
      .where(
        and(
          eq(workspaceInvite.workspaceId, ctx.workspace.id),
          // Pending invites only.
          isNull(workspaceInvite.acceptedAt),
          isNull(workspaceInvite.revokedAt),
        ),
      )
      .orderBy(workspaceInvite.createdAt)

    res.json({
      invites: rows.map((r) => ({
        id: r.id,
        email: r.email,
        role: r.role,
        invitedBy: { id: r.invitedById, name: r.invitedByName },
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
    })
  },
)

// ── Create invite ─────────────────────────────────────────────

teamRouter.post(
  "/invites",
  requireAuth,
  requireWorkspaceMember("admin"),
  async (req: Request, res: Response) => {
    const parsed = inviteBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const ctx = res.locals.workspaceContext!
    const session = res.locals.session!
    const { email, role } = parsed.data

    // Reject if the invitee is already a member.
    const [existingMember] = await db
      .select({ id: workspaceMember.id })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(
        and(
          eq(workspaceMember.workspaceId, ctx.workspace.id),
          eq(user.email, email),
        ),
      )
    if (existingMember) {
      throw new AppError("Already a workspace member", {
        status: 409,
        code: "ALREADY_MEMBER",
      })
    }

    const id = randomUUID()
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)
    const { token, tokenHash } = buildInviteToken({
      id,
      workspaceId: ctx.workspace.id,
      email,
    })

    try {
      await db.insert(workspaceInvite).values({
        id,
        workspaceId: ctx.workspace.id,
        email,
        role,
        invitedByUserId: session.user.id,
        tokenHash,
        expiresAt,
      })
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("An open invite already exists for this email", {
          status: 409,
          code: "ALREADY_INVITED",
        })
      }
      throw err
    }

    const acceptUrl = `${env.APP_URL.replace(/\/$/, "")}/accept-invite/${token}`
    const content = {
      inviterName: session.user.name,
      workspaceName: ctx.workspace.name,
      acceptUrl,
      role,
    }
    await sendEmail({
      to: email,
      subject: `Join ${ctx.workspace.name} on echoboard`,
      text: inviteEmailText(content),
      html: inviteEmailHtml(content),
    })

    res.status(201).json({
      invite: {
        id,
        email,
        role,
        invitedBy: { id: session.user.id, name: session.user.name },
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      },
    })
  },
)

// ── Revoke / resend ───────────────────────────────────────────

teamRouter.post(
  "/invites/:id/revoke",
  requireAuth,
  requireWorkspaceMember("admin"),
  async (req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid invite id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const [updated] = await db
      .update(workspaceInvite)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(workspaceInvite.id, id),
          eq(workspaceInvite.workspaceId, ctx.workspace.id),
          isNull(workspaceInvite.acceptedAt),
          isNull(workspaceInvite.revokedAt),
        ),
      )
      .returning({ id: workspaceInvite.id })
    if (!updated) {
      throw new AppError("Invite not found or already resolved", {
        status: 404,
        code: "INVITE_NOT_FOUND",
      })
    }
    res.status(204).send()
  },
)

// ── Preview (used by /accept-invite/[token] page) ────────────

teamRouter.get("/invites/preview", async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : null
  if (!token) {
    throw new AppError("Missing token", {
      status: 400,
      code: "VALIDATION_ERROR",
    })
  }
  const decoded = decodeInviteToken(token)
  if (!decoded) {
    throw new AppError("Invalid invite link", {
      status: 400,
      code: "INVALID_INVITE",
    })
  }
  const [row] = await db
    .select({
      invite: workspaceInvite,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      inviterName: user.name,
    })
    .from(workspaceInvite)
    .innerJoin(workspace, eq(workspace.id, workspaceInvite.workspaceId))
    .innerJoin(user, eq(user.id, workspaceInvite.invitedByUserId))
    .where(eq(workspaceInvite.id, decoded.id))
  if (!row) {
    throw new AppError("Invite not found", {
      status: 404,
      code: "INVITE_NOT_FOUND",
    })
  }
  if (row.invite.acceptedAt || row.invite.revokedAt) {
    throw new AppError("Invite is no longer active", {
      status: 410,
      code: "INVITE_RESOLVED",
    })
  }
  if (row.invite.expiresAt.getTime() < Date.now()) {
    throw new AppError("Invite has expired", {
      status: 410,
      code: "INVITE_EXPIRED",
    })
  }
  if (
    !verifyInviteSignature(decoded, {
      id: row.invite.id,
      workspaceId: row.invite.workspaceId,
      email: row.invite.email,
    })
  ) {
    throw new AppError("Invalid invite signature", {
      status: 400,
      code: "INVALID_INVITE",
    })
  }
  res.json({
    invite: {
      id: row.invite.id,
      email: row.invite.email,
      role: row.invite.role,
      workspace: { id: row.invite.workspaceId, name: row.workspaceName, slug: row.workspaceSlug },
      inviter: { name: row.inviterName },
      expiresAt: row.invite.expiresAt.toISOString(),
    },
  })
})

// ── Accept ────────────────────────────────────────────────────

teamRouter.post(
  "/invites/accept",
  requireAuth,
  async (req: Request, res: Response) => {
    const token = typeof req.body?.token === "string" ? req.body.token : null
    if (!token) {
      throw new AppError("Missing token", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const decoded = decodeInviteToken(token)
    if (!decoded) {
      throw new AppError("Invalid invite link", {
        status: 400,
        code: "INVALID_INVITE",
      })
    }
    const session = res.locals.session!

    const [row] = await db
      .select()
      .from(workspaceInvite)
      .where(eq(workspaceInvite.id, decoded.id))
    if (!row) {
      throw new AppError("Invite not found", {
        status: 404,
        code: "INVITE_NOT_FOUND",
      })
    }
    if (row.acceptedAt || row.revokedAt) {
      throw new AppError("Invite is no longer active", {
        status: 410,
        code: "INVITE_RESOLVED",
      })
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new AppError("Invite has expired", {
        status: 410,
        code: "INVITE_EXPIRED",
      })
    }
    if (
      !verifyInviteSignature(decoded, {
        id: row.id,
        workspaceId: row.workspaceId,
        email: row.email,
      })
    ) {
      throw new AppError("Invalid invite signature", {
        status: 400,
        code: "INVALID_INVITE",
      })
    }
    if (row.email.toLowerCase() !== session.user.email.toLowerCase()) {
      // Same address required — protects against link forwarding.
      throw new AppError(
        "This invite is for a different email address. Sign in with the invited email and try again.",
        { status: 403, code: "EMAIL_MISMATCH" },
      )
    }

    // Create membership row + mark invite accepted. Neon HTTP doesn't
    // support transactions, so we run them sequentially. If the membership
    // insert succeeds but the invite update fails, the user IS in the
    // workspace — the only fallout is the invite row staying pending,
    // which a re-accept attempt safely no-ops on (the membership insert's
    // unique violation is treated as success below).
    try {
      await db.insert(workspaceMember).values({
        id: randomUUID(),
        workspaceId: row.workspaceId,
        userId: session.user.id,
        role: row.role,
        addedByUserId: row.invitedByUserId,
      })
    } catch (err) {
      // If the user was already added through some other path, that's fine.
      if (!isUniqueViolation(err)) throw err
    }
    await db
      .update(workspaceInvite)
      .set({ acceptedAt: new Date() })
      .where(eq(workspaceInvite.id, row.id))

    setActiveWorkspaceCookie(res, row.workspaceId)
    const [ws] = await db
      .select({ id: workspace.id, slug: workspace.slug, name: workspace.name })
      .from(workspace)
      .where(eq(workspace.id, row.workspaceId))
    res.status(200).json({ workspace: ws })
  },
)

// ── Member admin (change role / remove / leave) ───────────────

teamRouter.patch(
  "/members/:id",
  requireAuth,
  requireWorkspaceMember("admin"),
  async (req: Request, res: Response) => {
    const parsed = roleBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const ctx = res.locals.workspaceContext!
    const session = res.locals.session!
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid membership id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const [target] = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, id),
          eq(workspaceMember.workspaceId, ctx.workspace.id),
        ),
      )
    if (!target) {
      throw new AppError("Member not found", {
        status: 404,
        code: "MEMBER_NOT_FOUND",
      })
    }
    if (target.userId === session.user.id) {
      throw new AppError("You can't change your own role", {
        status: 403,
        code: "FORBIDDEN",
      })
    }
    if (target.role === "owner") {
      throw new AppError("Owners can't be demoted from this surface", {
        status: 403,
        code: "FORBIDDEN",
      })
    }
    await db
      .update(workspaceMember)
      .set({ role: parsed.data.role })
      .where(eq(workspaceMember.id, id))
    res.status(204).send()
  },
)

teamRouter.delete(
  "/members/:id",
  requireAuth,
  requireWorkspaceMember("admin"),
  async (req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!
    const session = res.locals.session!
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid membership id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const [target] = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, id),
          eq(workspaceMember.workspaceId, ctx.workspace.id),
        ),
      )
    if (!target) {
      throw new AppError("Member not found", {
        status: 404,
        code: "MEMBER_NOT_FOUND",
      })
    }
    if (target.role === "owner") {
      throw new AppError("Owners can't be removed", {
        status: 403,
        code: "FORBIDDEN",
      })
    }
    if (target.userId === session.user.id) {
      throw new AppError("Use POST /team/leave to leave a workspace", {
        status: 403,
        code: "FORBIDDEN",
      })
    }
    await db.delete(workspaceMember).where(eq(workspaceMember.id, id))
    res.status(204).send()
  },
)

teamRouter.post(
  "/leave",
  requireAuth,
  requireWorkspaceMember(),
  async (_req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!
    const session = res.locals.session!
    if (ctx.role === "owner") {
      throw new AppError(
        "Owners can't leave — transfer ownership or delete the workspace first.",
        { status: 403, code: "OWNER_CANNOT_LEAVE" },
      )
    }
    await db
      .delete(workspaceMember)
      .where(
        and(
          eq(workspaceMember.userId, session.user.id),
          eq(workspaceMember.workspaceId, ctx.workspace.id),
        ),
      )
    res.status(204).send()
  },
)

// Local helpers

function isUniqueViolation(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const code = (err as { code?: string }).code
  if (code === "23505") return true
  return /duplicate key|unique constraint/i.test(err.message)
}

