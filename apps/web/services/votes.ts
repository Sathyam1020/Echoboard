import { httpClient } from "@/lib/http/axios-client"

export type VoteResult = {
  hasVoted: boolean
  voteCount: number
}

// Toggles the viewer's vote on a post. Backend is idempotent on repeated
// calls — final response is authoritative.
export async function toggleVote(postId: string): Promise<VoteResult> {
  const { data } = await httpClient.post<VoteResult>(
    `/api/posts/${encodeURIComponent(postId)}/vote`,
    {},
  )
  return data
}
