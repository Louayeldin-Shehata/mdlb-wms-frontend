import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

export const runtime = "nodejs";

type Body = {
  key: string;
  url: string;
  sortOrder?: number;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  try {
    requireAdmin(session);
  } catch (e) {
    const msg = (e as Error).message;
    return new Response(msg === "FORBIDDEN" ? "Forbidden" : "Unauthorized", {
      status: msg === "FORBIDDEN" ? 403 : 401,
    });
  }

  const { id: variantId } = await ctx.params;

  const body = (await req.json()) as Partial<Body>;
  if (!body.key || !body.url) return new Response("Missing key/url", { status: 400 });

  const created = await prisma.variantImage.create({
    data: {
      variantId,
      key: body.key,
      url: body.url,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
    select: { id: true },
  });

  return Response.json(created);
}

