import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import type { ComponentProps } from "react"

import { Callout } from "@/components/blog/callout"

// shadcn-style typography for blog markdown. We deliberately don't use
// `prose` (Tailwind Typography) because shadcn projects favor explicit
// per-element styles — they compose better with the site's font stack
// and warm-neutral tokens than prose's defaults.

export const mdxComponents = {
  Callout,

  h1: ({ className, ...props }: ComponentProps<"h1">) => (
    <h1
      className={cn(
        "mt-12 scroll-mt-24 text-[32px] font-medium leading-tight -tracking-[0.02em] sm:text-[36px]",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentProps<"h2">) => (
    <h2
      className={cn(
        "mt-10 scroll-mt-24 border-b border-border-soft pb-2 text-[24px] font-medium -tracking-[0.015em] sm:text-[26px]",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentProps<"h3">) => (
    <h3
      className={cn(
        "mt-8 scroll-mt-24 text-[18px] font-medium -tracking-[0.01em] sm:text-[20px]",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: ComponentProps<"p">) => (
    <p
      className={cn(
        "mt-5 text-[15px] leading-[1.7] text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, href, ...props }: ComponentProps<"a">) => {
    // Internal links go through next/link for client transitions; external
    // links open in a new tab with `noopener noreferrer`.
    const isExternal = href?.startsWith("http") ?? false
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-[3px] transition-colors hover:decoration-foreground",
            className,
          )}
          {...props}
        />
      )
    }
    const { ref: _ref, ...rest } = props as ComponentProps<"a">
    return (
      <Link
        href={href ?? "#"}
        className={cn(
          "font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-[3px] transition-colors hover:decoration-foreground",
          className,
        )}
        {...rest}
      />
    )
  },
  ul: ({ className, ...props }: ComponentProps<"ul">) => (
    <ul
      className={cn(
        "mt-5 ml-5 flex list-disc flex-col gap-2 text-[15px] leading-[1.7] text-foreground/90 marker:text-muted-foreground/60",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: ComponentProps<"ol">) => (
    <ol
      className={cn(
        "mt-5 ml-5 flex list-decimal flex-col gap-2 text-[15px] leading-[1.7] text-foreground/90 marker:text-muted-foreground/60",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: ComponentProps<"blockquote">) => (
    <blockquote
      className={cn(
        "mt-6 border-l-2 border-foreground/30 pl-5 text-[15px] italic leading-[1.7] text-foreground/85",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }: ComponentProps<"code">) => (
    <code
      className={cn(
        "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: ComponentProps<"pre">) => (
    <pre
      className={cn(
        "mt-6 overflow-x-auto rounded-xl border border-border bg-card p-4 text-[13px] leading-relaxed",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: ComponentProps<"hr">) => (
    <hr
      className={cn("my-10 border-t border-border-soft", className)}
      {...props}
    />
  ),
  table: ({ className, ...props }: ComponentProps<"table">) => (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table
        className={cn(
          "w-full text-[13.5px]",
          className,
        )}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }: ComponentProps<"th">) => (
    <th
      className={cn(
        "border-b border-border bg-muted/40 px-4 py-2.5 text-left text-[12px] font-medium uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentProps<"td">) => (
    <td
      className={cn(
        "border-b border-border-soft px-4 py-2.5 align-top text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
}
