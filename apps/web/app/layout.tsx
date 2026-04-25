import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Inter, JetBrains_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { Providers } from "@/app/providers"
import { ThemeProvider } from "@/components/theme-provider"
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
        "font-sans"
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
      </body>
    </html>
  )
}
