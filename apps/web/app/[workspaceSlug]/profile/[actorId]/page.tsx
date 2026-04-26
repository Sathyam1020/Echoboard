import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicProfileContent } from "@/components/profile/public-profile-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"
import { fetchAllFeedbackSSR } from "@/services/boards.server"
import {
  fetchProfileCommentsSSR,
  fetchProfileFeedbackSSR,
  fetchProfileSSR,
} from "@/services/profile.server"

type RouteParams = { workspaceSlug: string; actorId: string }
type RouteSearch = { tab?: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug, actorId } = await params
  try {
    const profile = await fetchProfileSSR({ workspaceSlug, actorId })
    const title = `${profile.actor.name} — ${profile.workspace.name}`
    const description = `${profile.actor.name}'s feedback and comments on ${profile.workspace.name}.`
    const url = absoluteUrl(`/${workspaceSlug}/profile/${actorId}`)
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: "profile",
        url,
        images: [
          absoluteUrl(
            `/og?title=${encodeURIComponent(profile.actor.name)}&description=${encodeURIComponent(`${profile.totals.feedbackCount} feedback · ${profile.totals.commentCount} comments`)}&type=board`,
          ),
        ],
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: `Profile — ${SITE_NAME}` }
  }
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>
  searchParams: Promise<RouteSearch>
}) {
  const { workspaceSlug, actorId } = await params
  const { tab } = await searchParams

  const queryClient = makeQueryClient()

  try {
    // Profile + workspace meta + first page of feedback always.
    // Comments only when the active tab is comments — saves a round
    // trip on the default view.
    const wantComments = tab === "comments"
    const [profile, meta, feedbackPage, commentsPage] = await Promise.all([
      fetchProfileSSR({ workspaceSlug, actorId }),
      fetchAllFeedbackSSR(workspaceSlug),
      fetchProfileFeedbackSSR({ workspaceSlug, actorId }),
      wantComments
        ? fetchProfileCommentsSSR({ workspaceSlug, actorId })
        : Promise.resolve(null),
    ])
    queryClient.setQueryData(
      queryKeys.profile.detail(workspaceSlug, actorId),
      profile,
    )
    queryClient.setQueryData(queryKeys.boards.allFeedback(workspaceSlug), meta)
    queryClient.setQueryData(queryKeys.profile.feedback(workspaceSlug, actorId), {
      pages: [feedbackPage],
      pageParams: [null],
    })
    if (commentsPage) {
      queryClient.setQueryData(
        queryKeys.profile.comments(workspaceSlug, actorId),
        { pages: [commentsPage], pageParams: [null] },
      )
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicProfileContent
        workspaceSlug={workspaceSlug}
        actorId={actorId}
      />
    </HydrationBoundary>
  )
}
