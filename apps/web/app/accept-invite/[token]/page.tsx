import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AcceptInviteCard } from "@/components/team/accept-invite-card"
import { ApiError } from "@/lib/http/api-error"
import { getSession } from "@/lib/get-session"
import { fetchInvitePreviewSSR } from "@/services/team.server"

export const metadata: Metadata = {
  title: "Accept invite — echoboard",
  robots: { index: false, follow: false },
}

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await getSession()
  if (!session) {
    redirect(
      `/signin?redirectTo=${encodeURIComponent(`/accept-invite/${token}`)}`,
    )
  }

  let preview
  try {
    preview = await fetchInvitePreviewSSR(token)
  } catch (err) {
    return (
      <FullScreen>
        <InviteError message={err instanceof ApiError ? err.message : "Invalid invite link"} />
      </FullScreen>
    )
  }

  return (
    <FullScreen>
      <AcceptInviteCard
        token={token}
        invite={preview.invite}
        currentEmail={session.user.email}
      />
    </FullScreen>
  )
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-3)] px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <h1 className="text-lg font-medium">Invite unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
