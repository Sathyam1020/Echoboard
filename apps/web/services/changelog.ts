import { httpClient } from "@/lib/http/axios-client"
import type { PublicChangelogEntry } from "@/components/changelog/types"

// Metadata-only — entries moved to a paginated sub-endpoint.
export type PublicChangelogResponse = {
  workspace: { id: string; name: string; slug: string; ownerId: string }
  firstBoard: { id: string; name: string; slug: string } | null
}

export async function fetchPublicChangelog(
  workspaceSlug: string,
): Promise<PublicChangelogResponse> {
  const { data } = await httpClient.get<PublicChangelogResponse>(
    `/api/changelog/public/${encodeURIComponent(workspaceSlug)}`,
  )
  return data
}

export type ChangelogEntriesPage = {
  entries: PublicChangelogEntry[]
  nextCursor: string | null
}

export async function fetchPublicChangelogEntries(args: {
  workspaceSlug: string
  cursor?: string | null
}): Promise<ChangelogEntriesPage> {
  const params = new URLSearchParams()
  if (args.cursor) params.set("cursor", args.cursor)
  const qs = params.toString()
  const { data } = await httpClient.get<ChangelogEntriesPage>(
    `/api/changelog/public/${encodeURIComponent(args.workspaceSlug)}/entries${qs ? `?${qs}` : ""}`,
  )
  return data
}
