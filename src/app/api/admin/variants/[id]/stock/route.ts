import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { getVariantBalance } from "@/lib/inventory";

export const runtime = "nodejs";

type Body = {
  type: "RECEIVE" | "ADJUST";
  quantity: number;
  note?: string;
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

  if (body.type !== "RECEIVE" && body.type !== "ADJUST") {
    return new Response("Invalid type", { status: 400 });
  }
  if (typeof body.quantity !== "number" || !Number.isInteger(body.quantity)) {
    return new Response("Invalid quantity", { status: 400 });
  }

  // ADJUST can be negative; RECEIVE should be positive.
  if (body.type === "RECEIVE" && body.quantity <= 0) {
    return new Response("RECEIVE must be > 0", { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createdByUserId = (session as any).user?.id as string | undefined;

  await prisma.inventoryLedgerEntry.create({
    data: {
      variantId,
      type: body.type,
      quantity: body.quantity,
      note: typeof body.note === "string" ? body.note : undefined,
      createdByUserId: createdByUserId ?? null,
    },
  });

  const balance = await getVariantBalance(variantId);
  return Response.json(balance);
}

