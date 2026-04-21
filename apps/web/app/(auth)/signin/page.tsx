import { Suspense } from "react"

import { AuthCard } from "@/components/auth/auth-card"
import { Divider } from "@/components/auth/divider"
import { GoogleButton } from "@/components/auth/google-button"
import { SigninForm } from "@/components/auth/signin-form"

export default function SigninPage() {
  return (
    <AuthCard title="Sign in" subtitle="Welcome back">
      <GoogleButton />
      <Divider />
      <Suspense fallback={null}>
        <SigninForm />
      </Suspense>
    </AuthCard>
  )
}
