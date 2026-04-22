const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

if (!BASE_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not set")
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, options: { status: number; code: string }) {
    super(message)
    this.name = "ApiError"
    this.status = options.status
    this.code = options.code
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      // leave body null
    }
  }

  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } })
      ?.error
    throw new ApiError(err?.message ?? `Request failed: ${res.status}`, {
      status: res.status,
      code: err?.code ?? "REQUEST_FAILED",
    })
  }

  return body as T
}

// Browser-side helpers. `credentials: "include"` forwards the Better Auth
// session cookie on the same-origin-with-credentials policy we set up in CORS.
export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
    return parseResponse<T>(res)
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return parseResponse<T>(res)
  },
}

// Server-side helpers (Server Components, Route Handlers). Forwards the
// incoming request's cookie header to the backend so the session propagates.
// Mirrors the pattern in `lib/get-session.ts`.
export const serverApi = {
  async get<T>(path: string): Promise<T> {
    const { headers: nextHeaders } = await import("next/headers")
    const cookie = (await nextHeaders()).get("cookie") ?? ""
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json", cookie },
    })
    return parseResponse<T>(res)
  },
}
