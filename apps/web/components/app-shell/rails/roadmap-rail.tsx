"use client"

import { Plus, Route } from "lucide-react"

import { ContextRail, RailGroup, RailLink } from "../context-rail"

export function RoadmapRail({ workspaceSlug }: { workspaceSlug?: string }) {
  const publicHref = workspaceSlug ? `/${workspaceSlug}` : undefined

  return (
    <ContextRail title="Roadmap" publicHref={publicHref}>
      <RailGroup label="Roadmaps">
        <RailLink
          href="/dashboard/roadmap"
          label="Main Roadmap"
          icon={Route}
          matchExact
        />
      </RailGroup>

      <RailGroup label="More">
        <RailLink label="Create & Edit Roadmaps" icon={Plus} disabled />
      </RailGroup>
    </ContextRail>
  )
}
