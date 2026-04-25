import "server-only"

import { serverHttp } from "@/lib/http/server-axios"

import type {
  ChangelogDetailResponse,
  ChangelogListResponse,
} from "./changelog-admin"

export function fetchChangelogListSSR(): Promise<ChangelogListResponse> {
  return serverHttp.get<ChangelogListResponse>("/api/changelog")
}

export function fetchChangelogDetailSSR(
  entryId: string,
): Promise<ChangelogDetailResponse> {
  return serverHttp.get<ChangelogDetailResponse>(
    `/api/changelog/${encodeURIComponent(entryId)}`,
  )
}
