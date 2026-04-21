import { headers } from "next/headers"

import { authClient } from "./auth-client"

export async function getSession() {
  const h = await headers()
  const res = await authClient.getSession({ fetchOptions: { headers: h } })
  return res.data ?? null
}

export type SessionData = Awaited<ReturnType<typeof getSession>>
