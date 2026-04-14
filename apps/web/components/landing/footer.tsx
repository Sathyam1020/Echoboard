import { type ComponentProps } from "react"

const FOOTER_LINKS = [
  { href: "#features", label: "Product" },
  { href: "#pricing", label: "Pricing" },
  { href: "#demo", label: "Roadmap" },
  { href: "#changelog", label: "Changelog" },
  { href: "#", label: "Blog" },
] as const

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded bg-primary text-primary-foreground">
            <span className="text-[9px] font-medium">E</span>
          </span>
          <span>echoboard</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-mono tabular-nums">© 2026</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <IconLink href="https://x.com" label="X">
            <XGlyph />
          </IconLink>
          <IconLink href="https://github.com" label="GitHub">
            <GithubGlyph />
          </IconLink>
        </div>
      </div>
    </footer>
  )
}

function IconLink({
  href,
  label,
  children,
}: ComponentProps<"a"> & { label: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </a>
  )
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
      <path d="M18.244 2H21.5l-7.52 8.59L22.75 22h-6.77l-5.3-6.93L4.6 22H1.34l8.04-9.19L1.25 2h6.94l4.79 6.33L18.244 2Zm-2.37 18h1.87L8.21 4H6.22l9.654 16Z" />
    </svg>
  )
}

function GithubGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.635 22.41c.575.105.785-.25.785-.555 0-.275-.01-1.005-.015-1.97-3.2.695-3.875-1.54-3.875-1.54-.525-1.33-1.28-1.685-1.28-1.685-1.045-.715.08-.7.08-.7 1.155.08 1.765 1.185 1.765 1.185 1.03 1.765 2.7 1.255 3.36.96.105-.745.4-1.255.73-1.545-2.555-.29-5.24-1.28-5.24-5.695 0-1.255.45-2.285 1.185-3.09-.12-.29-.515-1.465.11-3.055 0 0 .965-.31 3.165 1.18a11 11 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.235 2.765.115 3.055.74.805 1.185 1.835 1.185 3.09 0 4.425-2.69 5.4-5.255 5.685.41.355.78 1.05.78 2.115 0 1.525-.015 2.755-.015 3.13 0 .305.21.665.795.55A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}
