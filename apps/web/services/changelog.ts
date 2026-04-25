import { httpClient } from "@/lib/http/axios-client"
import type { PublicChangelogEntry } from "@/components/changelog/types"

export type PublicChangelogResponse = {
  workspace: { id: string; name: string; slug: string }
  firstBoard: { id: string; name: string; slug: string } | null
  entries: PublicChangelogEntry[]
}

export async function fetchPublicChangelog(
  workspaceSlug: string,
): Promise<PublicChangelogResponse> {
  const { data } = await httpClient.get<PublicChangelogResponse>(
    `/api/changelog/public/${encodeURIComponent(workspaceSlug)}`,
  )
  return data
}
