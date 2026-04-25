// Single error class used by every axios client (browser, server, widget).
// Mirrors the shape backend handlers throw so callers can switch on `code`
// and surface localized messages keyed by the same enum.
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

type BackendErrorBody = {
  error?: { code?: string; message?: string }
}

// Normalizes an axios error into our ApiError. Used by every client's
// response interceptor so domain code only ever has to catch ApiError.
export function normalizeAxiosError(err: unknown): never {
  // axios error shape: { response, request, message, code, ... }
  const e = err as {
    response?: { status?: number; data?: BackendErrorBody }
    message?: string
    code?: string
  }
  if (e.response) {
    const body = e.response.data
    const status = e.response.status ?? 0
    throw new ApiError(
      body?.error?.message ?? `Request failed: ${status}`,
      { status, code: body?.error?.code ?? "REQUEST_FAILED" },
    )
  }
  // No response — network/CORS/abort.
  throw new ApiError(e.message ?? "Network error", {
    status: 0,
    code: e.code ?? "NETWORK_ERROR",
  })
}
