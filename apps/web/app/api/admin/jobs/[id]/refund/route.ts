import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdmin();
  if (adminUser.error) {
    return NextResponse.json({ error: adminUser.error }, { status: 403 });
  }

  const { id } = await context.params;
  const { error } = await getSupabaseAdmin().rpc("refund_video_job_credit", {
    p_job_id: id,
    p_source: "admin_refund"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
