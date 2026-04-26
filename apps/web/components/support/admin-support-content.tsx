"use client"

import { MessagesSquare } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { EmptyHint } from "@/components/common/empty-hint"
import { useSupportSocket } from "@/hooks/realtime/use-support-socket"
import { useWorkspacesMeQuery } from "@/hooks/use-workspaces"

import { ConversationList } from "./conversation-list"
import { ConversationThread } from "./conversation-thread"
import { SearchBar } from "./search-bar"
import { SearchResults } from "./search-results"
import { StatusFilter } from "./status-filter"
import type { ConversationStatus } from "./types"

// Top-level admin support page. Two-pane layout: list on the left,
// active thread on the right. Mounts the WebSocket subscription for
// the active workspace + active conversation; cache patches handled
// inside use-support-socket.
export function AdminSupportContent({
  initialConversationId,
}: {
  initialConversationId?: string
}) {
  const router = useRouter()
  const params = useParams<{ conversationId?: string }>()
  const activeId =
    params.conversationId ?? initialConversationId ?? null

  const wsQuery = useWorkspacesMeQuery()
  const workspace = wsQuery.data?.workspaces[0] ?? null

  const [filter, setFilter] = useState<{
    status?: ConversationStatus
    mine?: boolean
  }>({})
  const [search, setSearch] = useState("")

  // Mount the realtime hook ONCE here — it subscribes to the workspace
  // channel + the active conversation's channel and patches the
  // relevant React Query caches as events arrive.
  useSupportSocket({
    workspaceId: workspace?.id ?? "",
    conversationId: activeId ?? null,
    filter,
  })

  function selectConversation(id: string): void {
    router.push(`/dashboard/support/${id}`)
  }

  return (
    <AdminPageShell activeItem="support">
      <AppTopbar
        title="Support"
        subtitle="Talk to customers in real time."
      />
      <div className="flex h-[calc(100dvh-var(--topbar-h,108px))] min-h-0 border-t border-border">
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-border bg-card">
          <SearchBar value={search} onChange={setSearch} />
          {search ? (
            <div className="flex-1 overflow-y-auto">
              <SearchResults
                query={search}
                onSelect={(conversationId) => {
                  setSearch("")
                  selectConversation(conversationId)
                }}
              />
            </div>
          ) : (
            <>
              <StatusFilter value={filter} onChange={setFilter} />
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  filter={filter}
                  activeId={activeId}
                  onSelect={selectConversation}
                />
              </div>
            </>
          )}
        </aside>

        <main className="flex flex-1 min-w-0">
          {activeId ? (
            <ConversationThread conversationId={activeId} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyHint
                variant="card"
                icon={MessagesSquare}
                title="Pick a conversation"
                description="Open a thread on the left to view messages."
              />
            </div>
          )}
        </main>
      </div>
    </AdminPageShell>
  )
}
