import { createHmac, timingSafeEqual } from "node:crypto"

import { env } from "../config/env.js"

// Workspace-invite token format: base64url(`${id}.${signature}`).
// `id` is the invite row's primary key. Signature is HMAC-SHA256 over
// (id, workspaceId, email) — server re-derives both from the loaded
// invite row at verify time, so a tampered email or workspace produces
// a mismatched signature.

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(input: string): string {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), "=")
  return Buffer.from(padded, "base64").toString("utf8")
}

function sign(parts: { id: string; workspaceId: string; email: string }): string {
  return createHmac("sha256", env.WORKSPACE_INVITE_SECRET)
    .update(`${parts.id}.${parts.workspaceId}.${parts.email.toLowerCase()}`)
    .digest("hex")
}

export function buildInviteToken(parts: {
  id: string
  workspaceId: string
  email: string
}): { token: string; tokenHash: string } {
  const signature = sign(parts)
  return {
    token: base64UrlEncode(`${parts.id}.${signature}`),
    tokenHash: signature,
  }
}

export type InviteTokenPayload = { id: string; signature: string }

export function decodeInviteToken(token: string): InviteTokenPayload | null {
  let raw: string
  try {
    raw = base64UrlDecode(token)
  } catch {
    return null
  }
  const [id, signature] = raw.split(".")
  if (!id || !signature) return null
  return { id, signature }
}

export function verifyInviteSignature(
  payload: InviteTokenPayload,
  invite: { id: string; workspaceId: string; email: string },
): boolean {
  const expected = sign(invite)
  // timingSafeEqual requires equal-length buffers; reject early on mismatch.
  if (expected.length !== payload.signature.length) return false
  return timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(payload.signature, "utf8"),
  )
}
