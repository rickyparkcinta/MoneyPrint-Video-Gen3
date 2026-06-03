import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@moneyprint/shared"]
  // NOTE: typedRoutes was intentionally disabled. It rejects placeholder links
  // (e.g. the "/contact" CTA on the pricing page) at build time. Re-enable once
  // every Link points at a real route.
};

export default nextConfig;
