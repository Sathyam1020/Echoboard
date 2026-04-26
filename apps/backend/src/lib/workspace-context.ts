import { and, db, desc, eq } from "@workspace/db/client"
import { workspace, workspaceMember } from "@workspace/db/schema"
import type { NextFunction, Request, Response } from "express"

import { AppError } from "../middleware/error-handler.js"

import { readCookie, setCookie } from "./cookies.js"

export type WorkspaceRole = "owner" | "admin" | "member"

export type WorkspaceContext = {
  workspace: { id: string; slug: string; name: string }
  role: WorkspaceRole
  membershipId: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      workspaceContext?: WorkspaceContext
    }
  }
}

const ACTIVE_COOKIE = "active_workspace_id"
// 90 days. Long enough to feel sticky; short enough to expire on long-idle accounts.
const ACTIVE_MAX_AGE = 90 * 24 * 60 * 60

const ROLE_RANK: Record<WorkspaceRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
}

function rankRole(role: WorkspaceRole): number {
  return ROLE_RANK[role]
}

// Resolves the active workspace + role for the current user.
// Strategy: cookie → membership lookup, fallback to first membership by
// recency. Returns null if the user has no memberships yet (e.g. brand
// new sign-up before a workspace exists).
export async function getActiveWorkspace(
  req: Request,
): Promise<WorkspaceContext | null> {
  const userId = req.res?.locals?.session?.user?.id
  if (!userId) return null

  const memberships = await db
    .select({
      membershipId: workspaceMember.id,
      workspaceId: workspaceMember.workspaceId,
      role: workspaceMember.role,
      slug: workspace.slug,
      name: workspace.name,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .where(eq(workspaceMember.userId, userId))
    .orderBy(desc(workspaceMember.createdAt))

  if (memberships.length === 0) return null

  const cookieId = readCookie(req, ACTIVE_COOKIE)
  const matched = cookieId
    ? memberships.find((m) => m.workspaceId === cookieId)
    : null
  const chosen = matched ?? memberships[0]!

  return {
    workspace: {
      id: chosen.workspaceId,
      slug: chosen.slug,
      name: chosen.name,
    },
    role: chosen.role,
    membershipId: chosen.membershipId,
  }
}

// Express middleware: requires the requester to be a workspace member of
// at least the given role. Sets `res.locals.workspaceContext` for the
// route handler. Must run AFTER `requireAuth`.
export function requireWorkspaceMember(minRole: WorkspaceRole = "member") {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!res.locals.session) {
        throw new AppError("Not signed in", {
          status: 401,
          code: "UNAUTHORIZED",
        })
      }
      const ctx = await getActiveWorkspace(req)
      if (!ctx) {
        throw new AppError("No active workspace", {
          status: 403,
          code: "NO_WORKSPACE",
        })
      }
      if (rankRole(ctx.role) < rankRole(minRole)) {
        throw new AppError("Insufficient role", {
          status: 403,
          code: "FORBIDDEN",
        })
      }
      res.locals.workspaceContext = ctx
      next()
    } catch (err) {
      next(err)
    }
  }
}

// Same as requireWorkspaceMember, but resolves the workspace from a
// route param (workspaceId) instead of the active cookie. Used by
// surfaces that need to act against an explicit workspace regardless
// of the requester's currently-active one (e.g. POST /workspaces/:id/activate).
export function requireWorkspaceMemberOf(
  paramName: string,
  minRole: WorkspaceRole = "member",
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = res.locals.session?.user?.id
      if (!userId) {
        throw new AppError("Not signed in", {
          status: 401,
          code: "UNAUTHORIZED",
        })
      }
      const workspaceId = req.params[paramName]
      if (typeof workspaceId !== "string" || !workspaceId) {
        throw new AppError("Invalid workspace id", {
          status: 400,
          code: "VALIDATION_ERROR",
        })
      }
      const [row] = await db
        .select({
          membershipId: workspaceMember.id,
          role: workspaceMember.role,
          slug: workspace.slug,
          name: workspace.name,
        })
        .from(workspaceMember)
        .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
        .where(
          and(
            eq(workspaceMember.userId, userId),
            eq(workspaceMember.workspaceId, workspaceId),
          ),
        )
      if (!row) {
        throw new AppError("Not a workspace member", {
          status: 403,
          code: "FORBIDDEN",
        })
      }
      if (rankRole(row.role) < rankRole(minRole)) {
        throw new AppError("Insufficient role", {
          status: 403,
          code: "FORBIDDEN",
        })
      }
      res.locals.workspaceContext = {
        workspace: { id: workspaceId, slug: row.slug, name: row.name },
        role: row.role,
        membershipId: row.membershipId,
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function setActiveWorkspaceCookie(
  res: Response,
  workspaceId: string,
): void {
  setCookie(res, ACTIVE_COOKIE, workspaceId, {
    maxAgeSeconds: ACTIVE_MAX_AGE,
    sameSite: "Lax",
  })
}

// Helper for routes that previously did `eq(workspace.ownerId, userId)`.
// Returns the user's role in the given workspace, or null if not a member.
export async function getMemberRole(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const [row] = await db
    .select({ role: workspaceMember.role })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.userId, userId),
        eq(workspaceMember.workspaceId, workspaceId),
      ),
    )
  return row?.role ?? null
}

export function isAtLeastRole(
  role: WorkspaceRole | null,
  minRole: WorkspaceRole,
): boolean {
  return role !== null && rankRole(role) >= rankRole(minRole)
}

// Throws 403 if the user can't mutate the workspace (i.e. not at-least-admin).
// Used by existing admin-only mutation routes that previously hardcoded an
// owner-id equality check.
export async function assertCanMutateWorkspace(
  userId: string,
  workspaceId: string,
  minRole: WorkspaceRole = "admin",
): Promise<WorkspaceRole> {
  const role = await getMemberRole(userId, workspaceId)
  if (!isAtLeastRole(role, minRole)) {
    throw new AppError("Not authorized for this workspace", {
      status: 403,
      code: "FORBIDDEN",
    })
  }
  return role!
}
