import { ArrowRight } from "lucide-react"
import Link from "next/link"

import type { BlogPost } from "@/lib/blog"

// Card used on the blog index and in "Related posts" sections at the
// bottom of each post. Compact + dense — three columns on lg.
export function BlogCard({ post }: { post: BlogPost }) {
  const date = new Date(post.frontmatter.publishedAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  )
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {(post.frontmatter.tags ?? []).slice(0, 1).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
        <span className="text-muted-foreground/50">·</span>
        <span>{post.readingMinutes} min read</span>
      </div>
      <h3 className="text-[16px] font-medium leading-snug -tracking-[0.005em]">
        {post.frontmatter.title}
      </h3>
      <p className="text-[13.5px] leading-relaxed text-muted-foreground">
        {post.frontmatter.description}
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[12px] text-muted-foreground">
        <time dateTime={post.frontmatter.publishedAt}>{date}</time>
        <ArrowRight
          className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  )
}
