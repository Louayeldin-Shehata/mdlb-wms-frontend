import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  async rewrites() {
    const explicit = process.env.RENDER_BACKEND_URL?.trim();
    const base =
      explicit && explicit.length > 0
        ? explicit
        : process.env.NODE_ENV !== "production"
          ? "http://localhost:3001"
          : "";
    if (!base) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${base.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
