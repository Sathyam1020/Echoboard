"use client"

import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

import { authClient } from "@/lib/auth-client"

import { UserMenu } from "./user-menu"

export function AuthNavSlot() {
  const { data, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="size-7" aria-hidden />
  }

  if (data?.user) {
    return (
      <UserMenu
        name={data.user.name}
        email={data.user.email}
        image={data.user.image}
      />
    )
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

export function AuthNavSlotMobile({ onSelect }: { onSelect?: () => void }) {
  const { data, isPending } = authClient.useSession()

  if (isPending) return null

  if (data?.user) {
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
      <Button
        asChild
        className="w-full shadow-none"
        onClick={onSelect}
      >
        <Link href="/signup">Start free →</Link>
      </Button>
    </div>
  )
}
