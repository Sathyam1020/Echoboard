"use client"

import { useState, type ReactNode } from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { BoardMockup } from "./board-mockup"
import { ChangelogMockup } from "./changelog-mockup"
import { FadeIn } from "./fade-in"
import { RoadmapMockup } from "./roadmap-mockup"

type Tab = "board" | "roadmap" | "changelog"
const TABS: { id: Tab; label: string }[] = [
  { id: "board", label: "Feedback board" },
  { id: "roadmap", label: "Roadmap" },
  { id: "changelog", label: "Changelog" },
]

export function ProductDemo() {
  const [tab, setTab] = useState<Tab>("board")

  return (
    <section id="demo" className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
              Built for teams who ship
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Three views. One source of truth.
            </p>
          </div>
        </FadeIn>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="items-stretch"
        >
          <FadeIn delay={80}>
            <div className="scrollbar-thin -mx-6 mb-6 flex justify-center overflow-x-auto px-6">
              <TabsList className="!h-auto gap-1 rounded-full border border-border !bg-card p-1.5">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="h-auto flex-none rounded-full px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!shadow-none"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </FadeIn>

          <FadeIn delay={160}>
            <BrowserChrome
              url={`feedback.yourcompany.com/${tab === "board" ? "" : tab}`}
            >
              <TabsContent
                value="board"
                className="data-[state=active]:animate-in data-[state=active]:duration-300 data-[state=active]:fade-in-0"
              >
                <BoardMockup />
              </TabsContent>
              <TabsContent
                value="roadmap"
                className="data-[state=active]:animate-in data-[state=active]:duration-300 data-[state=active]:fade-in-0"
              >
                <RoadmapMockup />
              </TabsContent>
              <TabsContent
                value="changelog"
                className="data-[state=active]:animate-in data-[state=active]:duration-300 data-[state=active]:fade-in-0"
              >
                <ChangelogMockup />
              </TabsContent>
            </BrowserChrome>
          </FadeIn>
        </Tabs>
      </div>
    </section>
  )
}

function BrowserChrome({
  url,
  children,
}: {
  url: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[oklch(0.72_0.16_25)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.82_0.13_85)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.75_0.14_145)]" />
        </div>
        <div className="flex-1">
          <div className="mx-auto flex h-6 max-w-sm items-center justify-center rounded-md border border-border bg-background px-3 font-mono text-[11px] text-muted-foreground">
            {url}
          </div>
        </div>
        <div className="w-10" />
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}
