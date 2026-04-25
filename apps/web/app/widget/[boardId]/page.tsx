import { notFound } from "next/navigation"

import type { PostRow } from "@/components/boards/types"
import { WidgetUI } from "@/components/widget/widget-ui"
import { ApiError, serverApi } from "@/lib/api"

type WidgetConfig = {
  boardId: string
  boardSlug: string
  boardName: string
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  requireSignedIdentify: boolean
  color: string | null
  position: "bottom-right" | "bottom-left"
  buttonText: string
  showBranding: boolean
}

export default async function WidgetIframePage({
  params,
  searchParams,
}: {
  params: Promise<{ boardId: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { boardId } = await params
  const { preview: previewFlag } = await searchParams
  const isPreview = previewFlag === "1"

  let config: WidgetConfig
  try {
    config = await serverApi.get<WidgetConfig>(
      `/api/widget/${encodeURIComponent(boardId)}/config`,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  // Initial post list — same endpoint the public board uses.
  const { posts } = await serverApi.get<{ posts: PostRow[] }>(
    `/api/boards/${encodeURIComponent(boardId)}/posts`,
  )

  return (
    <WidgetUI
      config={{
        boardId: config.boardId,
        boardSlug: config.boardSlug,
        boardName: config.boardName,
        workspaceId: config.workspaceId,
        workspaceSlug: config.workspaceSlug,
        workspaceName: config.workspaceName,
        color: config.color,
        buttonText: config.buttonText,
        showBranding: config.showBranding,
        requireSignedIdentify: config.requireSignedIdentify,
      }}
      initialPosts={posts}
      preview={isPreview}
    />
  )
}
