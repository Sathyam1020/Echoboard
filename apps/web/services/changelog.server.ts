import "server-only"

import { serverHttp } from "@/lib/http/server-axios"

import type { PublicChangelogResponse } from "./changelog"

export function fetchPublicChangelogSSR(
  workspaceSlug: string,
): Promise<PublicChangelogResponse> {
  return serverHttp.get<PublicChangelogResponse>(
    `/api/changelog/public/${encodeURIComponent(workspaceSlug)}`,
  )
}
