"use client"

import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

import { authClient } from "@/lib/auth-client"

import { UserMenu } from "./user-menu"

export type InitialAuth = {
  name: string
  email: string
  image: string | null
} | null

// Auth slot in the marketing nav. Receives `initialAuth` from the server
// page so the right shell (avatar OR sign-in buttons) is in the initial
// HTML. We still subscribe to `useSession` for live updates (e.g. the user
// signs out from another tab), but the *initial* render no longer waits
// for a client-side session round-trip — that wait was making the avatar
// the LCP at ~8s on throttled connections.
function resolveAuth(
  live: ReturnType<typeof authClient.useSession>,
  initial: InitialAuth,
): InitialAuth {
  // Until live data arrives, trust the server-provided value.
  if (live.isPending) return initial
  if (live.data?.user) {
    return {
      name: live.data.user.name,
      email: live.data.user.email,
      image: live.data.user.image ?? null,
    }
  }
  return null
}

export function AuthNavSlot({ initialAuth }: { initialAuth: InitialAuth }) {
  const live = authClient.useSession()
  const auth = resolveAuth(live, initialAuth)

  if (auth) {
    return <UserMenu name={auth.name} email={auth.email} image={auth.image} />
  }

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <Link
        href="/signin"
        className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
      >
        Log in
      </Link>
      <Button asChild className="hidden shadow-none md:inline-flex">
        <Link href="/signup">Start free →</Link>
      </Button>
    </div>
  )
}

export function AuthNavSlotMobile({
  initialAuth,
  onSelect,
}: {
  initialAuth: InitialAuth
  onSelect?: () => void
}) {
  const live = authClient.useSession()
  const auth = resolveAuth(live, initialAuth)

  if (auth) {
    return (
      <div className="mt-6 flex flex-col gap-2">
        <Button
          asChild
          variant="outline"
          className="w-full shadow-none"
          onClick={onSelect}
        >
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={async () => {
            await authClient.signOut()
            onSelect?.()
          }}
        >
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      <Button
        asChild
        variant="outline"
        className="w-full shadow-none"
        onClick={onSelect}
      >
        <Link href="/signin">Log in</Link>
      </Button>
      <Button asChild className="w-full shadow-none" onClick={onSelect}>
        <Link href="/signup">Start free →</Link>
      </Button>
    </div>
  )
}
