import { Client } from "@upstash/qstash";

let qstashClient: Client | null = null;

export function getQstashClient(): Client {
  if (!qstashClient) {
    const token = getQstashToken();
    if (!token) {
      throw new Error("Missing required env var: UPSTASH_QSTASH_TOKEN");
    }

    qstashClient = new Client({
      token
    });
  }
  return qstashClient;
}

export function getRenderDispatchConfigError(): string | null {
  if (!getRenderWorkerUrl()) {
    return "Missing required env var: RENDER_WORKER_URL";
  }

  if (!getQstashToken()) {
    return "Missing required env var: UPSTASH_QSTASH_TOKEN";
  }

  return null;
}

export function getRenderWorkerUrl(): string | null {
  const value =
    process.env.RENDER_WORKER_URL ||
    process.env.VIDEO_WORKER_URL ||
    process.env.WORKER_URL ||
    process.env.RENDER_EXTERNAL_URL;

  return value?.trim().replace(/\/+$/, "") || null;
}

export async function publishRenderDispatch(jobId: string) {
  const workerUrl = getRenderWorkerUrl();
  if (!workerUrl) {
    throw new Error("Missing required env var: RENDER_WORKER_URL");
  }

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

function getQstashToken(): string | null {
  return process.env.UPSTASH_QSTASH_TOKEN || process.env.QSTASH_TOKEN || null;
}
