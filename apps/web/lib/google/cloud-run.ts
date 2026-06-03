import { GoogleAuth } from "google-auth-library";
import { requiredEnv } from "@/lib/env";

let auth: GoogleAuth | null = null;

function getGoogleAuth() {
  if (!auth) {
    const clientEmail = requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = requiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

    auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
  }
  return auth;
}

export async function runMoneyPrintCloudJob(jobId: string, userId: string) {
  const projectId = requiredEnv("GOOGLE_CLOUD_PROJECT_ID");
  const region = requiredEnv("GOOGLE_CLOUD_REGION");
  const jobName = requiredEnv("GOOGLE_CLOUD_RUN_JOB_NAME");
  const endpoint = `https://run.googleapis.com/v2/projects/${projectId}/locations/${region}/jobs/${jobName}:run`;
  const client = await getGoogleAuth().getClient();

  const response = await client.request<{
    metadata?: { name?: string };
    name?: string;
  }>({
    url: endpoint,
    method: "POST",
    data: {
      overrides: {
        containerOverrides: [
          {
            env: [
              { name: "VIDEO_JOB_ID", value: jobId },
              { name: "VIDEO_JOB_USER_ID", value: userId }
            ]
          }
        ]
      }
    }
  });

  return response.data.metadata?.name || response.data.name || null;
}
