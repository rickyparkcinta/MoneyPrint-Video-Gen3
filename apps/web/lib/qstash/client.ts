import { Client, Receiver } from "@upstash/qstash";
import { requiredEnv } from "@/lib/env";

let qstashClient: Client | null = null;
let qstashReceiver: Receiver | null = null;

export function getQstashClient(): Client {
  if (!qstashClient) {
    qstashClient = new Client({ token: requiredEnv("QSTASH_TOKEN") });
  }
  return qstashClient;
}

export function getQstashReceiver(): Receiver {
  if (!qstashReceiver) {
    qstashReceiver = new Receiver({
      currentSigningKey: requiredEnv("QSTASH_CURRENT_SIGNING_KEY"),
      nextSigningKey: requiredEnv("QSTASH_NEXT_SIGNING_KEY")
    });
  }
  return qstashReceiver;
}

export async function publishRenderDispatch(jobId: string, userId: string) {
  const url = requiredEnv("QSTASH_DISPATCH_URL");
  const response = await getQstashClient().publishJSON({
    url,
    body: { job_id: jobId, user_id: userId, attempt: 1 },
    retries: 3
  });

  return response.messageId;
}
