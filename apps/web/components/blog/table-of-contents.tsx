import { cn } from "@workspace/ui/lib/utils"

import type { TocEntry } from "@/lib/blog"

// Sticky right-rail TOC for blog posts. Server component — no scroll-spy
// active-section highlighting (would require client JS for diminishing
// returns). The native `:target` styling on the anchored h2/h3 plus
// rehype-autolink-headings's `aria-hidden` icon is enough.
export function TableOfContents({ items }: { items: TocEntry[] }) {
  if (items.length < 2) return null
  return (
    <nav
      aria-label="On this page"
      className="sticky top-20 hidden max-h-[calc(100vh-6rem)] flex-col gap-3 overflow-y-auto py-2 lg:flex"
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        On this page
      </div>
      <ol className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={`${item.depth}-${item.id}`}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block rounded-sm text-[12.5px] leading-snug text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                item.depth === 3 && "pl-3 text-[12px]",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
