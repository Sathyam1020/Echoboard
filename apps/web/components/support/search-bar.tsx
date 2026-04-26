"use client"

import { Input } from "@workspace/ui/components/input"
import { Search, X } from "lucide-react"

export function SearchBar({
  value,
  onChange,
  placeholder = "Search conversations…",
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative px-3 pt-3 pb-1">
      <Search
        className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-7 pr-7 text-[13px]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
