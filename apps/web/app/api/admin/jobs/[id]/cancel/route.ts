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
  const { error } = await getSupabaseAdmin().rpc("cancel_video_job_and_refund", {
    p_job_id: id,
    p_message: "Cancelled by admin."
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
