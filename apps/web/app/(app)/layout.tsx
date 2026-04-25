import { redirect } from "next/navigation"
import { type ReactNode } from "react"

import { serverApi } from "@/lib/api"
import { getSession } from "@/lib/get-session"

type WorkspaceRow = { id: string }
type BoardRow = { boardId: string }

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { workspaces } = await serverApi.get<{ workspaces: WorkspaceRow[] }>(
    "/api/workspaces/me"
  )
  if (workspaces.length === 0) redirect("/onboarding/workspace")

  const { boards } = await serverApi.get<{ boards: BoardRow[] }>(
    "/api/dashboard/boards"
  )
  if (boards.length === 0) redirect("/onboarding/board")

  return (
    <>
      {children}
      <script
        src="http://localhost:3000/widget.js"
        data-board-id="26b6823b-157d-4eb7-b2c3-0a37c889a9c7"
        async
      ></script>
    </>
  )
}
