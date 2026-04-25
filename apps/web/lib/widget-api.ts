// Bearer-aware fetch wrapper for the widget iframe.
//
// The widget runs cross-origin from any host SaaS site. The loader on the
// host page calls /api/visitors/identify and gets back a `visitorToken`.
// That token reaches the iframe via postMessage; the iframe uses it as
// `Authorization: Bearer <token>` on every API call.
//
// We always send `credentials: "omit"`. The widget is cross-origin by
// design (and 3rd-party cookies don't survive Safari ITP / Chrome's
// 3rd-party cookie phase-out anyway), so it must rely entirely on Bearer.
// Sending `credentials: "include"` against the widget CORS config (which
// has `credentials: false` to keep CSRF surface tight) gets blocked by
// the browser even before the request lands.

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
    credentials: "omit",
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
