// Bearer-aware fetch wrapper for the widget iframe.
//
// The widget runs cross-origin from any host SaaS site. The loader on the
// host page calls /api/visitors/identify and gets back a `visitorToken`.
// That token reaches the iframe via postMessage; the iframe uses it as
// `Authorization: Bearer <token>` on every API call.
//
// Falling back to `credentials: include` is intentional for the in-app
// preview (same-origin to echoboard.io — cookie auth works fine there).

import { ApiError } from "./api"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BASE_URL) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set")

let bearerToken: string | null = null

export function setWidgetBearer(token: string | null): void {
  bearerToken = token
}

export function getWidgetBearer(): string | null {
  return bearerToken
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      // ignore
    }
  }
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } })?.error
    throw new ApiError(err?.message ?? `Request failed: ${res.status}`, {
      status: res.status,
      code: err?.code ?? "REQUEST_FAILED",
    })
  }
  return body as T
}

function buildInit(method: string, body?: unknown): RequestInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`
  return {
    method,
    headers,
    // With Bearer, omit cookies so we don't accidentally fall back to a
    // stale visitor cookie from a previous session. Without Bearer, ride
    // cookies — supports the same-origin preview iframe.
    credentials: bearerToken ? "omit" : "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }
}

export const widgetApi = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, buildInit("GET"))
    return parseResponse<T>(res)
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, buildInit("POST", body))
    return parseResponse<T>(res)
  },
}
