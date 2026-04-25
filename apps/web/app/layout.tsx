import { TooltipProvider } from "@workspace/ui/components/tooltip"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { Providers } from "@/app/providers"
import { Analytics } from "@/components/seo/analytics"
import { ThemeProvider } from "@/components/theme-provider"
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo"
import { cn } from "@workspace/ui/lib/utils"

// Backend origin (typed via .env). Without preconnect, the first API call
// after hydration eats ~150-300ms on DNS+TCP+TLS to a cold origin. Adding
// the hint pulls that handshake off the critical path.
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// Match cal.com: Inter for body text, JetBrains Mono for data (counts, MRR,
// dates). Variables keep the same names so existing styles (`font-sans`,
// `font-mono`) continue to resolve.
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Centralized site metadata. Page-level `generateMetadata` overrides
// title/description/canonical/openGraph as needed; everything here is the
// fallback for routes that don't define their own.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  keywords: SITE_DEFAULT_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": absoluteUrl("/blog/feed.xml"),
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/site.webmanifest",
  // Verification codes go here once Google Search Console / Bing /
  // Yandex are configured. Leaving the slot wired up so adding them is a
  // one-line change later.
  // verification: { google: "YOUR_CODE_HERE" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "scroll-pt-16 scroll-smooth antialiased",
        fontSans.variable,
        fontMono.variable,
        "font-sans",
      )}
    >
      <head>
        {BACKEND_ORIGIN ? (
          <link
            rel="preconnect"
            href={BACKEND_ORIGIN}
            crossOrigin="anonymous"
          />
        ) : null}
        {/* Google avatars — Better Auth's Google provider pulls profile
            images from this CDN. Without the preconnect the marketing nav
            avatar (LCP candidate when signed in) waits ~300ms on the
            handshake before it can begin downloading. */}
        <link
          rel="preconnect"
          href="https://lh3.googleusercontent.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
      </head>
      <body>
        <Providers>
          <ThemeProvider>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </ThemeProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
