import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthShell } from "@/components/auth/auth-shell"
import { Divider } from "@/components/auth/divider"
import { GoogleButton } from "@/components/auth/google-button"
import { SigninForm } from "@/components/auth/signin-form"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
}

export default function SigninPage() {
  return (
    <AuthShell
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Sign up
          </Link>
        </>
      }
    >
      <AuthCard title="Welcome back" subtitle="Log in to your workspace.">
        <GoogleButton />
        <Divider />
        <Suspense fallback={null}>
          <SigninForm />
        </Suspense>
      </AuthCard>
    </AuthShell>
  )
}
