import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"

import { SITE_NAME } from "@/lib/seo"

// Header used on every marketing/pSEO page (blog, alternatives, compare,
// for/...). The landing page keeps its own `<Nav>` because it has
// page-specific behavior (anchor scroll, IntersectionObserver section
// highlight) that doesn't make sense on a content page.
//
// Server component — no client-only behavior needed here. The mobile
// drawer uses shadcn Sheet which manages its own state.
const NAV_LINKS = [
  { href: "/alternatives", label: "Alternatives" },
  { href: "/compare", label: "Compare" },
  { href: "/for", label: "Use Cases" },
  { href: "/blog", label: "Blog" },
  { href: "/#pricing", label: "Pricing" },
] as const

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`${SITE_NAME} home`}
        >
          <span className="grid size-6 place-items-center rounded-md bg-foreground text-background">
            <span className="text-[11px] font-medium">E</span>
          </span>
          {SITE_NAME.toLowerCase()}
        </Link>

        <nav
          className="ml-auto hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0 md:gap-3">
          <Link
            href="/signin"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:inline-flex"
          >
            Log in
          </Link>
          <Button asChild className="hidden shadow-none md:inline-flex">
            <Link href="/signup">Start free →</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6">
              <SheetTitle className="mb-6 text-sm font-medium">
                {SITE_NAME.toLowerCase()}
              </SheetTitle>
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {NAV_LINKS.map((l) => (
                  <SheetClose asChild key={l.href}>
                    <Link
                      href={l.href}
                      className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-6 flex flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild variant="outline" className="w-full shadow-none">
                    <Link href="/signin">Log in</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild className="w-full shadow-none">
                    <Link href="/signup">Start free →</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
