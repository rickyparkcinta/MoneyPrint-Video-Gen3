import { createVideoJobFromRequest } from "@/lib/video-job-routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return createVideoJobFromRequest(request);
}
