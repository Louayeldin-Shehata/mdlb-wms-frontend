import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

export const runtime = "nodejs";

type PatchBody = {
  description?: string | null;
  isActive?: boolean | null;
};

export async function PATCH(
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

  const { id: productId } = await ctx.params;
  const body = (await req.json()) as Partial<PatchBody>;

  const data: { description?: string | null; isActive?: boolean } = {};

  if ("description" in body) {
    const raw = body.description;
    if (typeof raw === "string") data.description = raw.trim() ? raw.trim() : null;
    if (raw === null) data.description = null;
  }

  if ("isActive" in body) {
    const raw = body.isActive;
    if (typeof raw === "boolean") data.isActive = raw;
  }

  if (Object.keys(data).length === 0) {
    return new Response("No updates provided", { status: 400 });
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data,
    select: { id: true },
  });

  return Response.json({ ok: true, productId: updated.id });
}

