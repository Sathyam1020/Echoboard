import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo"

// Single component used by every page that emits structured data. Renders a
// `<script type="application/ld+json">` tag with the JSON stringified.
//
// Do NOT pretty-print or escape the JSON — Google's parser handles compact
// output just fine, and we avoid double-escape pitfalls with React.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ── Schema builders ─────────────────────────────────────────────────────
// Each returns a plain JS object that JsonLd serializes. Centralizing here
// means any drift in schema.org's expected shape is a one-file fix.

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon"),
    description: SITE_DEFAULT_DESCRIPTION,
    sameAs: [
      // Add when these exist:
      // "https://twitter.com/echoboard",
      // "https://github.com/echoboard",
    ],
  }
}

export function softwareApplicationSchema(opts?: {
  ratingValue?: string
  ratingCount?: string
}) {
  const { ratingValue = "4.8", ratingCount = "1" } = opts ?? {}
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: SITE_DEFAULT_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free forever plan with unlimited users",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue,
      ratingCount,
    },
  }
}

export type ArticleSchemaInput = {
  title: string
  description: string
  slug: string
  publishedAt: string
  updatedAt?: string
  author: string
  image?: string
  /** Word count of the post body — Google uses this as a quality signal. */
  wordCount?: number
  /** BCP 47 language code. Defaults to "en". */
  inLanguage?: string
}

export function articleSchema(post: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    inLanguage: post.inLanguage ?? "en",
    ...(post.wordCount ? { wordCount: post.wordCount } : {}),
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon") },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    image: post.image ? absoluteUrl(post.image) : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
  }
}

export type BreadcrumbItem = { label: string; href?: string }

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      // Trailing item (the current page) intentionally has no `item`.
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  }
}

export type FaqItem = { question: string; answer: string }

export function faqPageSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  }
}
