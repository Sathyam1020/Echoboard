import { httpClient } from "@/lib/http/axios-client"
import type {
  ChangelogEntry,
  ChangelogEntryDetail,
  ChangelogListEntry,
  ShippedPost,
} from "@/components/changelog/types"

export type ChangelogListResponse = { entries: ChangelogListEntry[] }
export type ChangelogDetailResponse = { entry: ChangelogEntryDetail }

export async function fetchChangelogList(): Promise<ChangelogListResponse> {
  const { data } = await httpClient.get<ChangelogListResponse>("/api/changelog")
  return data
}

export async function fetchChangelogDetail(
  entryId: string,
): Promise<ChangelogDetailResponse> {
  const { data } = await httpClient.get<ChangelogDetailResponse>(
    `/api/changelog/${encodeURIComponent(entryId)}`,
  )
  return data
}

export async function fetchShippedPosts(): Promise<{ posts: ShippedPost[] }> {
  const { data } = await httpClient.get<{ posts: ShippedPost[] }>(
    "/api/changelog/helpers/shipped-posts",
  )
  return data
}

export async function createChangelogEntry(body: {
  title: string
  body: string
  postIds?: string[]
}): Promise<{ entry: ChangelogEntry }> {
  const { data } = await httpClient.post<{ entry: ChangelogEntry }>(
    "/api/changelog",
    body,
  )
  return data
}

export async function updateChangelogEntry(
  entryId: string,
  body: { title?: string; body?: string; postIds?: string[] },
): Promise<{ entry: ChangelogEntry }> {
  const { data } = await httpClient.patch<{ entry: ChangelogEntry }>(
    `/api/changelog/${encodeURIComponent(entryId)}`,
    body,
  )
  return data
}

export async function publishChangelogEntry(
  entryId: string,
  body: { published: boolean },
): Promise<{ entry: ChangelogEntry }> {
  const { data } = await httpClient.patch<{ entry: ChangelogEntry }>(
    `/api/changelog/${encodeURIComponent(entryId)}/publish`,
    body,
  )
  return data
}

export async function deleteChangelogEntry(entryId: string): Promise<void> {
  await httpClient.delete(`/api/changelog/${encodeURIComponent(entryId)}`)
}

export async function linkChangelogPosts(
  entryId: string,
  body: { postIds: string[] },
): Promise<{ entry: ChangelogEntryDetail }> {
  const { data } = await httpClient.post<{ entry: ChangelogEntryDetail }>(
    `/api/changelog/${encodeURIComponent(entryId)}/linked-posts`,
    body,
  )
  return data
}

export async function unlinkChangelogPost(
  entryId: string,
  postId: string,
): Promise<{ entry: ChangelogEntryDetail }> {
  const { data } = await httpClient.delete<{ entry: ChangelogEntryDetail }>(
    `/api/changelog/${encodeURIComponent(entryId)}/linked-posts/${encodeURIComponent(postId)}`,
  )
  return data
}
