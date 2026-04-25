// Server-only axios for Server Components + Route Handlers.
//
// Forwards the incoming request's `cookie` header to the backend so the
// session propagates. Mirrors what the previous `serverApi` did.
//
// Also retries connection-level errors (ECONNREFUSED / ECONNRESET) — Turbo
// boots workspaces in parallel and `tsx watch` restarts the backend on file
// changes, either of which can leave the web SSR briefly unable to reach
// the backend. HTTP errors (4xx/5xx) still throw immediately.
import "server-only"

import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"
import { headers as nextHeaders } from "next/headers"

import { normalizeAxiosError } from "./api-error"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BASE_URL) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set")

// Fresh instance per call — the cookie store is request-scoped.
async function buildInstance(): Promise<AxiosInstance> {
  const cookie = (await nextHeaders()).get("cookie") ?? ""
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: cookie
      ? { "Content-Type": "application/json", cookie }
      : { "Content-Type": "application/json" },
  })
  instance.interceptors.response.use(
    (res) => res,
    (err) => normalizeAxiosError(err),
  )
  return instance
}

const RETRY_DELAYS_MS = [200, 400, 800, 1500, 2000, 2000, 2000, 2000, 2000, 2000]

function isConnectionError(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } }
  const code = e.code ?? e.cause?.code
  return (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "UND_ERR_SOCKET"
  )
}

async function requestWithRetry<T>(
  fn: (instance: AxiosInstance) => Promise<{ data: T }>,
): Promise<T> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const instance = await buildInstance()
      const { data } = await fn(instance)
      return data
    } catch (err) {
      // ApiError (HTTP 4xx/5xx) — surfaced by the interceptor — is final.
      // Connection errors land here as a raw axios/Node error, not ApiError.
      if (!isConnectionError(err) || attempt === RETRY_DELAYS_MS.length) throw err
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
    }
  }
  throw new Error("unreachable")
}

export const serverHttp = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    requestWithRetry<T>((i) => i.get(url, config)),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    requestWithRetry<T>((i) => i.post(url, body, config)),
}
