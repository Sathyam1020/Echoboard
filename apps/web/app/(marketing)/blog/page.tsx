import type { Metadata } from "next"

import { BlogCard } from "@/components/blog/blog-card"
import { CtaSection } from "@/components/marketing/cta-section"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { getAllPosts } from "@/lib/blog"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"

const TITLE = `${SITE_NAME} Blog`
const DESCRIPTION =
  "Practical writing on customer feedback, product roadmaps, pricing, and the SaaS feedback tool landscape."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/blog"),
    types: {
      "application/rss+xml": absoluteUrl("/blog/feed.xml"),
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/blog"),
    type: "website",
    images: [
      {
        url: absoluteUrl(
          `/og?title=${encodeURIComponent(TITLE)}&description=${encodeURIComponent(DESCRIPTION)}&type=blog`,
        ),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="flex flex-col gap-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog" },
        ]}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-[36px] font-medium leading-tight -tracking-[0.02em] sm:text-[44px]">
          {SITE_NAME} blog
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          {DESCRIPTION}
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-[14px] text-muted-foreground">
          No posts yet — the first ones land soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      <CtaSection variant="light" />
    </div>
  )
}
