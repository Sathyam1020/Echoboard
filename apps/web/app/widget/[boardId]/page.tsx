import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { WidgetUI } from "@/components/widget/widget-ui"
import { ApiError } from "@/lib/http/api-error"
import { fetchPostsByBoardSSR } from "@/services/boards.server"
import { fetchWidgetConfigSSR } from "@/services/widget-config.server"

// Widget surface is rendered inside an iframe on third-party sites. It's
// not a destination for search traffic — block crawlers explicitly.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
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

  let config: Awaited<ReturnType<typeof fetchWidgetConfigSSR>>
  try {
    config = await fetchWidgetConfigSSR(boardId)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  // Initial post list — first page only. The widget UI loads more on
  // scroll if the user wants to dig deeper.
  const { posts } = await fetchPostsByBoardSSR({ boardId })

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
