import { createAuthClient } from "better-auth/react"

export function makeAuthClient(baseURL: string) {
  return createAuthClient({
    baseURL,
    fetchOptions: {
      credentials: "include",
    },
  })
}

export type AuthClient = ReturnType<typeof makeAuthClient>
