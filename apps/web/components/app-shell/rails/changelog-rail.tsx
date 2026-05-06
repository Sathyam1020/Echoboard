"use client"

import { BarChart3, FileText, PenLine } from "lucide-react"

import { ContextRail, RailDot, RailGroup, RailLink } from "../context-rail"

export function ChangelogRail({ workspaceSlug }: { workspaceSlug?: string }) {
  const publicHref = workspaceSlug ? `/${workspaceSlug}/changelog` : undefined

  return (
    <ContextRail title="Changelog" publicHref={publicHref}>
      <RailGroup label="Status">
        <RailLink
          href="/dashboard/changelog?status=published"
          label="Published"
          icon={FileText}
        />
        <RailLink
          href="/dashboard/changelog?status=draft"
          label="Draft"
          icon={PenLine}
        />
      </RailGroup>

      <RailGroup label="Categories">
        <RailLink
          href="/dashboard/changelog?category=new"
          label="New"
          iconNode={<RailDot color="var(--rail-status-shipped)" />}
        />
        <RailLink
          href="/dashboard/changelog?category=improved"
          label="Improved"
          iconNode={<RailDot color="var(--rail-status-planned)" />}
        />
        <RailLink
          href="/dashboard/changelog?category=fixed"
          label="Fixed"
          iconNode={<RailDot color="var(--rail-status-progress)" />}
        />
      </RailGroup>

      <RailGroup label="More">
        <RailLink label="Analytics" icon={BarChart3} disabled />
      </RailGroup>
    </ContextRail>
  )
}
