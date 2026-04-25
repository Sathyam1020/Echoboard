import Link from "next/link"

import { SITE_NAME } from "@/lib/seo"

// Site-wide footer for marketing/pSEO pages. Internal-linking heavy by
// design — Google uses the footer to spread link equity across the
// pSEO surface. Every link points to a real page (or "Coming soon" for
// not-yet-built ones, marked visually so they don't look like broken
// promises).
//
// Pages referenced here that don't exist yet (privacy, terms, /docs)
// will 404 until they're built — that's intentional, footer links
// double as a TODO list for what to ship next.

type Column = {
  heading: string
  links: { label: string; href: string; soon?: boolean }[]
}

const COLUMNS: Column[] = [
  {
    heading: "Product",
    links: [
      { label: "Feedback boards", href: "/" },
      { label: "Public roadmap", href: "/" },
      { label: "Changelog", href: "/" },
      { label: "Widget", href: "/" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Canny alternatives", href: "/blog/canny-alternatives" },
      { label: "Canny pricing explained", href: "/blog/canny-pricing-explained" },
      { label: "RSS feed", href: "/blog/feed.xml" },
      { label: "Documentation", href: "/docs", soon: true },
    ],
  },
  {
    heading: "Alternatives",
    links: [
      { label: "Canny", href: "/alternatives/canny" },
      { label: "UserJot", href: "/alternatives/userjot" },
      { label: "Featurebase", href: "/alternatives/featurebase" },
      { label: "Nolt", href: "/alternatives/nolt" },
      { label: "All alternatives", href: "/alternatives" },
    ],
  },
  {
    heading: "Use Cases",
    links: [
      { label: "SaaS startups", href: "/for/saas-startups" },
      { label: "Developer tools", href: "/for/developer-tools" },
      { label: "Indie hackers", href: "/for/indie-hackers" },
      { label: "Open source", href: "/for/open-source" },
      { label: "All use cases", href: "/for" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy", soon: true },
      { label: "Terms of service", href: "/terms", soon: true },
      { label: "Security", href: "/security", soon: true },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {col.heading}
              </h3>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.soon ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground/70">
                        {link.label}
                        <span className="font-mono text-[10px] tracking-wide text-muted-foreground/50 uppercase">
                          Soon
                        </span>
                      </span>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-6 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="grid size-5 place-items-center rounded bg-foreground text-background text-[10px] font-medium">
              E
            </span>
            <span>
              © {new Date().getFullYear()} {SITE_NAME}. Built for SaaS teams
              tired of paying per tracked user.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
