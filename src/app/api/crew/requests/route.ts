import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";

export const runtime = "nodejs";

type Body = {
  note?: string | null;
  lines: { variantId: string; qtyRequested: number }[];
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  try {
    requireSession(session);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session as any).user?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as Partial<Body>;
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return new Response("Missing lines", { status: 400 });
  }

  const cleaned = body.lines
    .filter(
      (l) =>
        l &&
        typeof l.variantId === "string" &&
        typeof l.qtyRequested === "number" &&
        Number.isInteger(l.qtyRequested) &&
        l.qtyRequested > 0,
    )
    .map((l) => ({ variantId: l.variantId, qtyRequested: l.qtyRequested }));

  if (cleaned.length === 0) return new Response("Invalid lines", { status: 400 });

  const created = await prisma.crewRequest.create({
    data: {
      createdByUserId: userId,
      note: typeof body.note === "string" ? body.note : null,
      lines: {
        create: cleaned.map((l) => ({
          variantId: l.variantId,
          qtyRequested: l.qtyRequested,
        })),
      },
    },
    select: { id: true },
  });

  return Response.json(created);
}

