import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Inter, JetBrains_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { Providers } from "@/app/providers"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

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
