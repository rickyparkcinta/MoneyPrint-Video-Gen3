import { Client } from "@upstash/qstash";
import { requiredEnv } from "@/lib/env";

let qstashClient: Client | null = null;

export function getQstashClient(): Client {
  if (!qstashClient) {
    const token = process.env.UPSTASH_QSTASH_TOKEN || process.env.QSTASH_TOKEN;
    if (!token) {
      throw new Error("Missing required env var: UPSTASH_QSTASH_TOKEN");
    }

    qstashClient = new Client({
      token
    });
  }
  return qstashClient;
}

export async function publishRenderDispatch(jobId: string) {
  const workerUrl = requiredEnv("RENDER_WORKER_URL").replace(/\/+$/, "");
  const headers: Record<string, string> = {};

  if (process.env.WORKER_SHARED_SECRET) {
    headers.Authorization = `Bearer ${process.env.WORKER_SHARED_SECRET}`;
  }

  const response = await getQstashClient().publishJSON({
    url: `${workerUrl}/qstash/render`,
    body: { job_id: jobId },
    headers,
    retries: 3
  });

  return response.messageId;
}
