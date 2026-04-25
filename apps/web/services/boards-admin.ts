import { httpClient } from "@/lib/http/axios-client"

export async function createBoard(args: {
  workspaceId: string
  name: string
  slug: string
  visibility?: "public" | "private"
}): Promise<{ board: { id: string; slug: string }; workspaceSlug: string }> {
  const { workspaceId, ...body } = args
  const { data } = await httpClient.post<{
    board: { id: string; slug: string }
    workspaceSlug: string
  }>(`/api/workspaces/${encodeURIComponent(workspaceId)}/boards`, body)
  return data
}
