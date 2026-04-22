"use client"

import { Button } from "@workspace/ui/components/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { authClient } from "@/lib/auth-client"

export function SignOutButton({
  iconOnly = false,
}: {
  iconOnly?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      await authClient.signOut()
      router.push("/")
      router.refresh()
    })
  }

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClick}
        disabled={isPending}
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    )
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={isPending}>
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
