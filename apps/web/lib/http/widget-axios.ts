// Bearer-only axios for the widget iframe.
//
// The widget runs cross-origin from any host SaaS site. The host-page loader
// calls /api/visitors/identify and posts the resulting `visitorToken` into
// the iframe via postMessage. The iframe stashes it via `setWidgetBearer`
// and every subsequent call carries `Authorization: Bearer <token>`.
//
// `withCredentials: false` because 3rd-party cookies don't survive Safari ITP
// or Chrome's 3rd-party cookie phase-out. The widget CORS group on the backend
// (in `app.ts`) allows credentials, but we don't *use* them here.
import axios from "axios"

import { normalizeAxiosError } from "./api-error"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BASE_URL) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set")

let bearerToken: string | null = null

export function setWidgetBearer(token: string | null): void {
  bearerToken = token
}

export function getWidgetBearer(): string | null {
  return bearerToken
}

export const widgetHttp = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
})

widgetHttp.interceptors.request.use((cfg) => {
  if (bearerToken) {
    cfg.headers.set("Authorization", `Bearer ${bearerToken}`)
  }
  return cfg
})

widgetHttp.interceptors.response.use(
  (res) => res,
  (err) => normalizeAxiosError(err),
)
