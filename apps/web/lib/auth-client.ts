import { makeAuthClient, type AuthClient } from "@workspace/auth/client"

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL
if (!baseURL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not set")
}

export const authClient: AuthClient = makeAuthClient(baseURL)
