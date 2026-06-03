export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function canonicalRequestUrl(request: Request): string {
  const configuredUrl = process.env.QSTASH_DISPATCH_URL;
  if (configuredUrl) {
    return configuredUrl;
  }
  return request.url;
}
