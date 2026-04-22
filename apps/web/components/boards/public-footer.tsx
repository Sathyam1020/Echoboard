import Link from "next/link"

export function PublicFooter() {
  return (
    <div className="mt-12 border-t border-border-soft py-10 text-center">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>Powered by</span>
        <span className="flex size-[13px] items-center justify-center rounded bg-primary text-[9px] font-medium text-primary-foreground">
          E
        </span>
        <span className="font-medium">echoboard</span>
      </Link>
    </div>
  )
}
