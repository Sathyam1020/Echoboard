import { AuthCard } from "@/components/auth/auth-card"
import { Divider } from "@/components/auth/divider"
import { GoogleButton } from "@/components/auth/google-button"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Collect feedback, ship changelogs, prove traction."
    >
      <GoogleButton />
      <Divider />
      <SignupForm />
    </AuthCard>
  )
}
