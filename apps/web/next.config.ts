import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  // Use Next.js 16 monorepo tracing path instead of standard path
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

export default nextConfig;
