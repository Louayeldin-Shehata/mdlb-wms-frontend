import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { getVariantBalance } from "@/lib/inventory";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminUserId = (session as any).user?.id as string | undefined;

  const request = await prisma.crewRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      lines: {
        select: {
          id: true,
          qtyRequested: true,
          qtyReserved: true,
          variantId: true,
        },
      },
    },
  });
  if (!request) return new Response("Not found", { status: 404 });
  if (request.status !== "SUBMITTED") {
    return new Response("Request not in SUBMITTED state", { status: 400 });
  }

  // Validate availability first (outside transaction is ok for quick fail).
  for (const line of request.lines) {
    const remainingToReserve = line.qtyRequested - line.qtyReserved;
    if (remainingToReserve <= 0) continue;
    const bal = await getVariantBalance(line.variantId);
    if (bal.available < remainingToReserve) {
      return new Response(
        `Insufficient stock for variant ${line.variantId} (available ${bal.available}, need ${remainingToReserve})`,
        { status: 409 },
      );
    }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const line of request.lines) {
      const remainingToReserve = line.qtyRequested - line.qtyReserved;
      if (remainingToReserve <= 0) continue;

      await tx.inventoryLedgerEntry.create({
        data: {
          variantId: line.variantId,
          type: "RESERVE",
          quantity: remainingToReserve,
          createdByUserId: adminUserId ?? null,
          crewRequestLineId: line.id,
          note: "Reserved via request acknowledgement",
        },
      });

      await tx.crewRequestLine.update({
        where: { id: line.id },
        data: { qtyReserved: line.qtyReserved + remainingToReserve },
      });
    }

    await tx.crewRequest.update({
      where: { id: request.id },
      data: { status: "ACKNOWLEDGED" },
    });
  });

  return Response.json({ ok: true });
}

