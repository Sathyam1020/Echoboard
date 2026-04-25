import { ChevronRight } from "lucide-react"
import Link from "next/link"

import {
  JsonLd,
  breadcrumbSchema,
  type BreadcrumbItem,
} from "@/components/seo/json-ld"

// Visual breadcrumb nav + matching `BreadcrumbList` JSON-LD in one
// component. Render at the top of any pSEO/marketing page that has a
// hierarchy. The last item is rendered as plain text (current page); all
// others link.
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null

  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav aria-label="Breadcrumb" className="text-[12.5px] text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1
            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-foreground" : undefined}>
                    {item.label}
                  </span>
                )}
                {!isLast ? (
                  <ChevronRight
                    aria-hidden
                    className="size-3 text-muted-foreground/60"
                  />
                ) : null}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
