import { headers } from "next/headers"

import { authClient } from "./auth-client"

function isConnectionError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false
  const cause = (err as { cause?: { code?: string } }).cause
  const code = cause?.code
  return (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "UND_ERR_SOCKET"
  )
}

// Transient connection failures during turbo cold-boot or `tsx watch` restarts
// become "unauthed" — the app layout already handles null by redirecting to
// /signin. A page refresh after the backend is up re-establishes the session.
export async function getSession() {
  const h = await headers()
  try {
    const res = await authClient.getSession({ fetchOptions: { headers: h } })
    return res.data ?? null
  } catch (err) {
    if (isConnectionError(err)) return null
    throw err
  }
}

export type SessionData = Awaited<ReturnType<typeof getSession>>
