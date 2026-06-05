import { NextRequest, NextResponse } from "next/server"
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n"
import { normalizeReferralCode } from "@/lib/referrals"

export function middleware(request: NextRequest) {
  const referralCode = normalizeReferralCode(request.nextUrl.searchParams.get("ref"))
  if (referralCode && !request.nextUrl.pathname.startsWith("/r/")) {
    const url = request.nextUrl.clone()
    url.pathname = `/r/${referralCode}`
    url.search = ""
    return NextResponse.redirect(url)
  }

  const requestedLocale = request.nextUrl.searchParams.get("lang") ?? request.nextUrl.searchParams.get("locale")
  const locale = normalizeLocale(requestedLocale)

  if (!requestedLocale || !locale) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.searchParams.delete("lang")
  url.searchParams.delete("locale")

  const response = NextResponse.redirect(url)
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  })

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
