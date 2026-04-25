import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthShell } from "@/components/auth/auth-shell"
import { Divider } from "@/components/auth/divider"
import { GoogleButton } from "@/components/auth/google-button"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return (
    <AuthShell
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Log in
          </Link>
        </>
      }
    >
      <AuthCard
        title="Create your account"
        subtitle="Free forever plan, no credit card."
      >
        <GoogleButton />
        <Divider />
        <SignupForm />
      </AuthCard>
    </AuthShell>
  )
}
