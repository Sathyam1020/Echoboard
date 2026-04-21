"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

import { AuthNavSlot, AuthNavSlotMobile } from "@/components/nav/auth-nav-slot"

const NAV_LINKS = [
  { href: "#demo", id: "demo", label: "Product" },
  { href: "#pricing", id: "pricing", label: "Pricing" },
] as const

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const handleAnchor = (href: string) => (e: React.MouseEvent) => {
    if (!href.startsWith("#")) return
    const el = document.getElementById(href.slice(1))
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    history.replaceState(null, "", href)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-sm"
          : "border-b border-transparent bg-background",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          aria-label="Echoboard home"
        >
          <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[11px] font-medium">E</span>
          </span>
          echoboard
        </Link>

        <nav
          className="ml-auto hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((l) => {
            const isActive = active === l.id
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={handleAnchor(l.href)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
                <span
                  className={cn(
                    "pointer-events-none absolute inset-x-3 -bottom-px h-px origin-center bg-primary transition-transform duration-200",
                    isActive ? "scale-x-100" : "scale-x-0",
                  )}
                  aria-hidden="true"
                />
              </a>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0 md:gap-3">
          <AuthNavSlot />

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
                echoboard
              </SheetTitle>
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {NAV_LINKS.map((l) => {
                  const isActive = active === l.id
                  return (
                    <SheetClose asChild key={l.href}>
                      <a
                        href={l.href}
                        onClick={handleAnchor(l.href)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "rounded-md px-2 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {l.label}
                      </a>
                    </SheetClose>
                  )
                })}
              </nav>

              <SheetClose asChild>
                <div>
                  <AuthNavSlotMobile />
                </div>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
