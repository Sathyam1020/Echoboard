"use client"

import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      await authClient.signOut()
      router.push("/")
      router.refresh()
    })
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={isPending}>
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
