import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (adminUser.error) {
    return NextResponse.json({ error: adminUser.error }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { userId?: string; amount?: number } | null;
  if (!body?.userId || !body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "userId and positive amount are required." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().rpc("grant_user_credits", {
    p_user_id: body.userId,
    p_amount: body.amount,
    p_source: "admin_adjustment",
    p_stripe_event_id: null
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
