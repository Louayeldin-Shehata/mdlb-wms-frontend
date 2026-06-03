import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma + pg must run on the Node.js server runtime, not be bundled.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
