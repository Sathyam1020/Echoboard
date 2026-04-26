"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"

export function SigninForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get("redirectTo") ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectTo,
      })
      if (res.error) {
        const msg = res.error.message ?? "Unable to sign in."
        setError(msg)
        toast.error(msg)
        return
      }
      toast.success("Signed in")
      router.push(redirectTo)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isPending} className="mt-1 w-full">
        {isPending ? "Signing in…" : "Log in"}
      </Button>

      {/* TODO: wire this up when /forgot-password + /reset-password ship */}
      <Link
        href="#"
        aria-disabled="true"
        className="-mt-1 text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Forgot password?
      </Link>
    </form>
  )
}
