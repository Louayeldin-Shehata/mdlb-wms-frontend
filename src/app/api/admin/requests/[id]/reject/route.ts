import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
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

  const { id } = await ctx.params;

  const reqRow = await prisma.crewRequest.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!reqRow) return new Response("Not found", { status: 404 });
  if (reqRow.status !== "SUBMITTED") {
    return new Response("Request not in SUBMITTED state", { status: 400 });
  }

  await prisma.crewRequest.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  return Response.json({ ok: true });
}

