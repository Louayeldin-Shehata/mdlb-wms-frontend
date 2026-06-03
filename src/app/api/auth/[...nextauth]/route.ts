import NextAuth from "next-auth";
import { headers } from "next/headers";

import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const handler = NextAuth(authOptions);

async function ensureNextAuthUrlFromRequest() {
  // When the frontend (Vercel) proxies `/api/*` to this API (Render),
  // we can infer the public URL from request headers so cookie/session
  // URLs match the frontend domain without manually syncing NEXTAUTH_URL.
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.trim().length > 0) return;

  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const forwardedHost = h.get("x-forwarded-host") || "";
  const host = forwardedHost || h.get("host") || "";
  if (!host) return;

  process.env.NEXTAUTH_URL = `${proto}://${host}`;
}

export async function GET(req: Request) {
  await ensureNextAuthUrlFromRequest();
  return handler(req);
}

export async function POST(req: Request) {
  await ensureNextAuthUrlFromRequest();
  return handler(req);
}

