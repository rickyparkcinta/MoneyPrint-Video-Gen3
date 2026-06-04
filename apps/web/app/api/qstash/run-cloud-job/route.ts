import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Legacy dispatch is deprecated. QStash now targets the Render worker directly." },
    { status: 410 }
  );
}
