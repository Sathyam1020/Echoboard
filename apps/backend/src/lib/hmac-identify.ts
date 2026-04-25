import { createHmac, timingSafeEqual } from "node:crypto"

import { AppError } from "../middleware/error-handler.js"

// Custom 2-segment token format (lighter than JWT, no library dep):
//   token = base64url(payload).base64url(signature)
//   signature = HMAC-SHA256(secret, base64url(payload))
//
// Host SaaS computes this on their backend with the workspace's
// identifySecretKey; widget passes it through to /api/visitors/identify.
//
// Why not JWT: JWT adds a header segment we'd never use (algorithm is
// always HS256 here) plus standard claim quirks. This is simpler and
// every line is auditable.

export type SignedIdentityPayload = {
  externalId: string
  email?: string | null
  name?: string | null
  avatarUrl?: string | null
  // Unix seconds. Required. Token rejected if expired or > MAX_TTL ahead.
  exp: number
  // Unix seconds, optional. Informational; we don't hard-check.
  iat?: number
  // Free-form host metadata (plan, MRR, company, etc.).
  metadata?: Record<string, unknown>
}

const MAX_TTL_SECONDS = 15 * 60 // 15-minute window cap, prevents abusive long-lived tokens

function base64UrlDecode(input: string): Buffer {
  // base64url -> standard base64 + padding
  const std = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = std.length % 4 === 0 ? "" : "=".repeat(4 - (std.length % 4))
  return Buffer.from(std + pad, "base64")
}

function safeEqualBuffers(a: Buffer, b: Buffer): boolean {
  // timingSafeEqual throws when lengths differ — guard explicitly.
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function verifySignedIdentify(
  token: string,
  secret: string,
): SignedIdentityPayload {
  const dot = token.indexOf(".")
  if (dot < 1 || dot === token.length - 1) {
    throw new AppError("Malformed identify token", {
      status: 400,
      code: "IDENTIFY_TOKEN_MALFORMED",
    })
  }
  const payloadSeg = token.slice(0, dot)
  const sigSeg = token.slice(dot + 1)

  const expectedSig = createHmac("sha256", secret).update(payloadSeg).digest()
  const actualSig = base64UrlDecode(sigSeg)

  if (!safeEqualBuffers(expectedSig, actualSig)) {
    throw new AppError("Invalid identify signature", {
      status: 401,
      code: "IDENTIFY_SIGNATURE_INVALID",
    })
  }

  let payload: SignedIdentityPayload
  try {
    payload = JSON.parse(base64UrlDecode(payloadSeg).toString("utf8"))
  } catch {
    throw new AppError("Identify payload is not JSON", {
      status: 400,
      code: "IDENTIFY_TOKEN_MALFORMED",
    })
  }

  if (
    typeof payload.externalId !== "string" ||
    payload.externalId.length === 0
  ) {
    throw new AppError("Identify payload missing externalId", {
      status: 400,
      code: "IDENTIFY_TOKEN_MALFORMED",
    })
  }
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    throw new AppError("Identify payload missing exp", {
      status: 400,
      code: "IDENTIFY_TOKEN_MALFORMED",
    })
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (payload.exp <= nowSec) {
    throw new AppError("Identify token expired", {
      status: 401,
      code: "IDENTIFY_TOKEN_EXPIRED",
    })
  }
  // Cap how far in the future a token can claim to be valid — defends
  // against compromised secrets being used to issue forever-tokens.
  if (payload.exp - nowSec > MAX_TTL_SECONDS) {
    throw new AppError("Identify token TTL exceeds 15 minutes", {
      status: 401,
      code: "IDENTIFY_TOKEN_TTL_TOO_LONG",
    })
  }

  return payload
}

// Helper used by tests + the settings page's code-sample copy block. Not
// called at runtime by the verify path.
export function signIdentifyTokenForExample(
  payload: Omit<SignedIdentityPayload, "iat">,
  secret: string,
): string {
  const fullPayload = { ...payload, iat: Math.floor(Date.now() / 1000) }
  const segPayload = Buffer.from(JSON.stringify(fullPayload))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  const sig = createHmac("sha256", secret).update(segPayload).digest()
  const segSig = sig
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return `${segPayload}.${segSig}`
}
