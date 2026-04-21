import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const cookie = getSessionCookie(req)
  if (!cookie) {
    const url = new URL("/signin", req.url)
    url.searchParams.set("redirectTo", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
