import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { computeAutoSku, slugify } from "@/lib/sku";

export const runtime = "nodejs";

type CreateProductBody = {
  name: string;
  slug?: string;
  skuPrefix?: string | null;
  description?: string | null;
  sizeCodes?: string[]; // optional: create variants for these size codes
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  try {
    requireAdmin(session);
  } catch (e) {
    const msg = (e as Error).message;
    return new Response(msg === "FORBIDDEN" ? "Forbidden" : "Unauthorized", {
      status: msg === "FORBIDDEN" ? 403 : 401,
    });
  }

  const body = (await req.json()) as Partial<CreateProductBody>;
  if (!body.name || typeof body.name !== "string") {
    return new Response("Missing name", { status: 400 });
  }

  const slug = slugify(body.slug?.trim() || body.name);

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      skuPrefix: body.skuPrefix ?? null,
      description: body.description ?? null,
    },
  });

  if (Array.isArray(body.sizeCodes) && body.sizeCodes.length > 0) {
    const sizeOptions = await prisma.sizeOption.findMany({
      where: { code: { in: body.sizeCodes } },
      select: { id: true, code: true },
    });

    await prisma.productVariant.createMany({
      data: sizeOptions.map((s: (typeof sizeOptions)[number]) => {
        const autoSku = computeAutoSku({
          productSlug: product.slug,
          skuPrefix: product.skuPrefix,
          sizeCode: s.code,
        });
        return {
          productId: product.id,
          sizeOptionId: s.id,
          sku: autoSku,
          skuSource: "AUTO",
          autoSku,
        };
      }),
      skipDuplicates: true,
    });
  }

  return Response.json({ productId: product.id });
}

