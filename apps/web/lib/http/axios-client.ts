// Browser-side axios instance.
//
// Used by every React Query hook in the app (dashboard + public board).
// `withCredentials: true` carries the Better Auth session cookie + the
// visitor cookie to the backend (CORS on the backend allows credentials
// for echoboard origins + the widget paths).
import axios from "axios"

import { normalizeAxiosError } from "./api-error"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!BASE_URL) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set")

export const httpClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

httpClient.interceptors.response.use(
  (res) => res,
  (err) => normalizeAxiosError(err),
)
