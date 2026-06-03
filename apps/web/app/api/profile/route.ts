import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  const { user } = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in before updating your profile." }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { fullName?: unknown } | null
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : ""

  if (fullName.length > 120) {
    return NextResponse.json({ error: "Display name must be 120 characters or fewer." }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin().from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: fullName || null,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
