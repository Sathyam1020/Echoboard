import type { Request, Response } from "express"

import { env } from "../config/env.js"

// Lightweight cookie reader — Express 5 doesn't ship cookie-parser, and
// Better Auth handles its own cookies via the request headers. We only
// need to read one cookie (active_workspace_id) so a tiny header parse
// is cheaper than a new dependency.
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.split("=")
    if (!rawKey) continue
    if (rawKey.trim() !== name) continue
    return decodeURIComponent(rest.join("=").trim())
  }
  return null
}

export type CookieOptions = {
  maxAgeSeconds?: number
  httpOnly?: boolean
  // SameSite for the dashboard cookie. Defaults to "Lax" — sent on
  // top-level navigations + same-origin XHR, blocked on cross-site
  // POSTs (CSRF defense).
  sameSite?: "Lax" | "Strict" | "None"
}

// Sets a plain cookie. The value isn't signed because the cookies we
// write here only carry user *preferences* (active workspace pick) —
// every privileged read re-validates membership server-side, so a
// tampered cookie just means "fall back to the default workspace."
export function setCookie(
  res: Response,
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `SameSite=${options.sameSite ?? "Lax"}`,
  ]
  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${options.maxAgeSeconds}`)
  }
  if (options.httpOnly !== false) parts.push("HttpOnly")
  if (env.NODE_ENV === "production") parts.push("Secure")

  // Append rather than overwrite — Better Auth sets its own Set-Cookie on
  // the same response when sign-in completes; clobbering would log users out.
  const existing = res.getHeader("Set-Cookie")
  const next = parts.join("; ")
  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, next])
  } else if (typeof existing === "string") {
    res.setHeader("Set-Cookie", [existing, next])
  } else {
    res.setHeader("Set-Cookie", next)
  }
}

export function clearCookie(res: Response, name: string): void {
  setCookie(res, name, "", { maxAgeSeconds: 0 })
}
