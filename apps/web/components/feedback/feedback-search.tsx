"use client"

import { Input } from "@workspace/ui/components/input"
import { Search } from "lucide-react"

export function FeedbackSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative w-full sm:w-[220px]">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        placeholder="Search posts…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-8 text-[13px]"
      />
    </div>
  )
}
