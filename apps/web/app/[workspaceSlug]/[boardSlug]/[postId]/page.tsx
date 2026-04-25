import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PostDetailContent } from "@/components/post/post-detail-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import {
  fetchPostCommentsSSR,
  fetchPostDetailSSR,
} from "@/services/posts.server"

type RouteParams = {
  workspaceSlug: string
  boardSlug: string
  postId: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug, boardSlug, postId } = await params
  try {
    const data = await fetchPostDetailSSR(postId)
    const raw = data.post.description?.trim() ?? ""
    const truncated =
      raw.length > 155
        ? raw.slice(0, 155).replace(/\s+\S*$/, "") + "…"
        : raw
    const description =
      truncated || `Vote on this feature request for ${data.post.workspace.name}.`
    const title = `${data.post.title} — ${data.post.workspace.name}`
    const url = absoluteUrl(`/${workspaceSlug}/${boardSlug}/${postId}`)
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: "article",
        url,
        images: [
          absoluteUrl(
            `/og?title=${encodeURIComponent(data.post.title)}&description=${encodeURIComponent(`${data.post.voteCount} votes`)}&type=board`,
          ),
        ],
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: "Post not found" }
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { workspaceSlug, boardSlug, postId } = await params

  const queryClient = makeQueryClient()

  try {
    // Post detail + first page of comments in parallel — comments now
    // paginate via `useInfiniteQuery`, so we seed `pages[0]` for the
    // chronological feed and let scroll fetch subsequent pages.
    const [detail, commentsPage] = await Promise.all([
      fetchPostDetailSSR(postId),
      fetchPostCommentsSSR({ postId }),
    ])
    queryClient.setQueryData(queryKeys.posts.detail(postId), detail)
    queryClient.setQueryData(queryKeys.comments.byPost(postId), {
      pages: [commentsPage],
      pageParams: [null],
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostDetailContent
        postId={postId}
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
      />
    </HydrationBoundary>
  )
}
