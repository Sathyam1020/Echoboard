import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import { notFound } from "next/navigation"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

import { BlogCard } from "@/components/blog/blog-card"
import { mdxComponents } from "@/components/blog/mdx-components"
import { ShareButtons } from "@/components/blog/share-buttons"
import { TableOfContents } from "@/components/blog/table-of-contents"
import { CtaSection } from "@/components/marketing/cta-section"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { JsonLd, articleSchema } from "@/components/seo/json-ld"
import {
  extractToc,
  getAllPosts,
  getPost,
  getRelatedPosts,
} from "@/lib/blog"
import { absoluteUrl } from "@/lib/seo"

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  const fm = post.frontmatter
  const path = `/blog/${post.slug}`
  const ogImage =
    fm.image ??
    `/og?title=${encodeURIComponent(fm.title)}&description=${encodeURIComponent(fm.description)}&type=blog`

  return {
    title: fm.title,
    description: fm.description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: fm.title,
      description: fm.description,
      url: absoluteUrl(path),
      type: "article",
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt ?? fm.publishedAt,
      authors: [fm.author],
      tags: fm.tags,
      images: [
        {
          url: absoluteUrl(ogImage),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fm.title,
      description: fm.description,
    },
  }
}

// rehype-pretty-code config — Shiki-based syntax highlighting at build
// time. Default theme is github-dark; we use github-light to match the
// warm-neutral surface of the site (avoid the jarring dark block).
const PRETTY_CODE_OPTIONS = {
  theme: "github-light",
  keepBackground: false,
  defaultLang: "ts",
} as const

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const toc = extractToc(post.content)
  const related = getRelatedPosts(slug, 3)
  const fm = post.frontmatter
  const formattedDate = new Date(fm.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const url = absoluteUrl(`/blog/${post.slug}`)

  return (
    <div className="flex flex-col gap-12">
      <JsonLd
        data={articleSchema({
          title: fm.title,
          description: fm.description,
          slug: post.slug,
          publishedAt: fm.publishedAt,
          updatedAt: fm.updatedAt,
          author: fm.author,
          image: fm.image,
          wordCount: post.wordCount,
        })}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: fm.title },
        ]}
      />

      <article className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-border-soft pb-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {(fm.tags ?? []).slice(0, 2).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
              {(fm.tags ?? []).length > 0 ? (
                <span className="text-muted-foreground/50">·</span>
              ) : null}
              <span>{post.readingMinutes} min read</span>
            </div>
            <h1 className="text-[36px] font-medium leading-tight -tracking-[0.02em] sm:text-[44px]">
              {fm.title}
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
              {fm.description}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{fm.author}</span>
                <span className="text-muted-foreground/50">·</span>
                <time dateTime={fm.publishedAt}>{formattedDate}</time>
              </div>
              <ShareButtons url={url} title={fm.title} />
            </div>
          </header>

          <div className="mt-2">
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [
                    rehypeSlug,
                    [
                      rehypeAutolinkHeadings,
                      {
                        behavior: "wrap",
                        properties: {
                          className: ["heading-anchor"],
                        },
                      },
                    ],
                    [rehypePrettyCode, PRETTY_CODE_OPTIONS],
                  ],
                },
              }}
            />
          </div>

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-6 text-[12.5px] text-muted-foreground">
            <span>
              Last updated{" "}
              <time dateTime={fm.updatedAt ?? fm.publishedAt}>
                {new Date(fm.updatedAt ?? fm.publishedAt).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              </time>
            </span>
            <ShareButtons url={url} title={fm.title} />
          </footer>
        </div>

        <aside className="hidden lg:block">
          <TableOfContents items={toc} />
        </aside>
      </article>

      <CtaSection />

      {related.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-[18px] font-medium -tracking-[0.01em]">
            Keep reading
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
