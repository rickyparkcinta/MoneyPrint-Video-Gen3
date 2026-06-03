import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@moneyprint/shared"],
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
