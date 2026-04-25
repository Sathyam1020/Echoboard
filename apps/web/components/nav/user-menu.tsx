"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("")
}

// Why a plain `<img>` instead of shadcn/Radix `<AvatarImage>`:
// Radix's Avatar.Image hooks into `useImageLoadingStatus` and only mounts
// the actual `<img>` in the DOM after the image successfully loads on the
// *client*. With React hydration on a slow CPU, that means the image
// doesn't even start a network request until ~hydration time. On a
// throttled connection this made the avatar an ~8s LCP candidate on the
// marketing nav.
//
// A plain `<img>` (with explicit width/height for layout, fetchpriority
// "high", eager loading) ships in the SSR HTML — the browser can begin
// the request during HTML parse, before any JS runs.
export function UserMenu({
  name,
  email,
  image,
}: {
  name: string
  email: string
  image?: string | null
}) {
  const router = useRouter()

  async function onSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/")
          router.refresh()
        },
      },
    })
  }

  const initials = getInitials(name) || "·"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-medium text-muted-foreground select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* Initials sit underneath as the always-visible fallback. The
            real <img>, when it loads, covers them via absolute + object-cover. */}
        <span aria-hidden className="font-mono">
          {initials}
        </span>
        {image ? (
          <img
            src={image}
            alt={name}
            width={32}
            height={32}
            loading="eager"
            // fetchpriority is a valid HTML attribute (Chrome/FF/Safari)
            // that influences LCP scheduling. React types lag; lowercase
            // form passes through without warnings.
            fetchPriority="high"
            referrerPolicy="no-referrer"
            className="absolute inset-0 size-full rounded-full object-cover"
          />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm">{name}</span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
