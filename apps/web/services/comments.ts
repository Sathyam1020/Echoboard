import { httpClient } from "@/lib/http/axios-client"
import type { CommentRow } from "@/components/boards/types"

export async function createComment(
  postId: string,
  body: { body: string; parentId?: string | null },
): Promise<{ comment: CommentRow }> {
  const { data } = await httpClient.post<{ comment: CommentRow }>(
    `/api/posts/${encodeURIComponent(postId)}/comments`,
    body,
  )
  return data
}

export async function updateComment(
  commentId: string,
  body: { body: string },
): Promise<{ comment: CommentRow }> {
  const { data } = await httpClient.patch<{ comment: CommentRow }>(
    `/api/comments/${encodeURIComponent(commentId)}`,
    body,
  )
  return data
}

export async function deleteComment(
  commentId: string,
): Promise<{ comment: CommentRow }> {
  const { data } = await httpClient.delete<{ comment: CommentRow }>(
    `/api/comments/${encodeURIComponent(commentId)}`,
  )
  return data
}
