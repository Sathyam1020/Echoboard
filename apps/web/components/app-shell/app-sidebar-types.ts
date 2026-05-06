export type SidebarBoard = {
  id: string
  name: string
  slug: string
  workspaceSlug: string
  postCount: number
}

export type SidebarUser = {
  name: string
  email: string
  image?: string | null
}

export type SidebarActiveItem =
  | "feedback"
  | "roadmap"
  | "changelog"
  | "support"
  | "settings"
  | null
