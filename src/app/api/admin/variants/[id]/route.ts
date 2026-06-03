import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { computeAutoSku } from "@/lib/sku";

export const runtime = "nodejs";

type PatchBody = {
  customSku?: string | null;
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

  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<PatchBody>;

  const variant = await prisma.productVariant.findUnique({
    where: { id },
    select: {
      id: true,
      skuSource: true,
      sizeOption: { select: { code: true } },
      product: { select: { slug: true, skuPrefix: true, id: true } },
    },
  });
  if (!variant) return new Response("Not found", { status: 404 });

  const autoSku = computeAutoSku({
    productSlug: variant.product.slug,
    skuPrefix: variant.product.skuPrefix,
    sizeCode: variant.sizeOption.code,
  });

  const customSku =
    typeof body.customSku === "string" ? body.customSku.trim() : body.customSku;

  // If customSku is empty/null, revert to AUTO.
  if (!customSku) {
    const updated = await prisma.productVariant.update({
      where: { id },
      data: { skuSource: "AUTO", autoSku, sku: autoSku },
      select: { id: true, sku: true, skuSource: true, autoSku: true },
    });
    return Response.json(updated);
  }

  const updated = await prisma.productVariant.update({
    where: { id },
    data: { skuSource: "CUSTOM", autoSku, sku: customSku },
    select: { id: true, sku: true, skuSource: true, autoSku: true },
  });

  return Response.json(updated);
}

