import { httpClient } from "@/lib/http/axios-client"
import type { PostRow } from "@/components/boards/types"

// Admin-only mutations on posts. Read endpoints (board-by-slug, post detail)
// live in `services/boards.ts` + `services/posts.ts`.

export async function createAdminPost(
  boardId: string,
  body: { title: string; description: string },
): Promise<{ post: PostRow }> {
  const { data } = await httpClient.post<{ post: PostRow }>(
    `/api/boards/${encodeURIComponent(boardId)}/posts`,
    body,
  )
  return data
}

export async function updatePost(
  postId: string,
  body: { title?: string; description?: string },
): Promise<{ post: PostRow }> {
  const { data } = await httpClient.patch<{ post: PostRow }>(
    `/api/posts/${encodeURIComponent(postId)}`,
    body,
  )
  return data
}

export async function deletePost(postId: string): Promise<void> {
  await httpClient.delete(`/api/posts/${encodeURIComponent(postId)}`)
}

export async function pinPost(
  postId: string,
  body: { pinned: boolean },
): Promise<{ post: PostRow }> {
  const { data } = await httpClient.patch<{ post: PostRow }>(
    `/api/posts/${encodeURIComponent(postId)}/pin`,
    body,
  )
  return data
}

export async function updatePostStatus(
  postId: string,
  body: { status: string },
): Promise<{ post: { id: string; status: string } }> {
  const { data } = await httpClient.patch<{ post: { id: string; status: string } }>(
    `/api/posts/${encodeURIComponent(postId)}/status`,
    body,
  )
  return data
}

export async function mergePost(
  postId: string,
  body: { targetPostId: string },
): Promise<{ post: { id: string } }> {
  const { data } = await httpClient.post<{ post: { id: string } }>(
    `/api/posts/${encodeURIComponent(postId)}/merge`,
    body,
  )
  return data
}
