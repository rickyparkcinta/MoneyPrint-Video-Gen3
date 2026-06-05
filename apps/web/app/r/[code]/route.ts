import { NextRequest, NextResponse } from "next/server"
import { appUrl } from "@/lib/env"
import { normalizeReferralCode, REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from "@/lib/referrals"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params
  const code = normalizeReferralCode(rawCode)
  const redirectUrl = new URL("/signup", appUrl())
  const response = NextResponse.redirect(redirectUrl)

  if (!code || request.cookies.has(REFERRAL_COOKIE)) {
    return response
  }

  const { data } = await getSupabaseAdmin()
    .from("referral_codes")
    .select("code")
    .eq("code", code)
    .maybeSingle()

  if (data?.code) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  return response
}
