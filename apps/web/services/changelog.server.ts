import "server-only"

import { serverHttp } from "@/lib/http/server-axios"

import type {
  ChangelogEntriesPage,
  PublicChangelogResponse,
} from "./changelog"

export function fetchPublicChangelogSSR(
  workspaceSlug: string,
): Promise<PublicChangelogResponse> {
  return serverHttp.get<PublicChangelogResponse>(
    `/api/changelog/public/${encodeURIComponent(workspaceSlug)}`,
  )
}

export function fetchPublicChangelogEntriesSSR(args: {
  workspaceSlug: string
  cursor?: string | null
}): Promise<ChangelogEntriesPage> {
  const qs = args.cursor ? `?cursor=${encodeURIComponent(args.cursor)}` : ""
  return serverHttp.get<ChangelogEntriesPage>(
    `/api/changelog/public/${encodeURIComponent(args.workspaceSlug)}/entries${qs}`,
  )
}
