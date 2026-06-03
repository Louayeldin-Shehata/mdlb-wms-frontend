import * as XLSX from "xlsx";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { computeBalanceFromSums } from "@/lib/inventoryMath";

export const runtime = "nodejs";

const TEMPLATE_FILENAME =
  "ssdd-zone-1774266185-sskr-zone-1772453310-Bulk_inventory_upload_update_template_v3.3.xlsx";

export async function GET() {
  const session = await getServerSession(authOptions);
  try {
    requireAdmin(session);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const variants = await prisma.productVariant.findMany({
    where: { product: { isActive: true } },
    select: {
      id: true,
      sku: true,
      skuSource: true,
      autoSku: true,
      product: { select: { slug: true, skuPrefix: true } },
      sizeOption: { select: { code: true } },
    },
  });

  const variantIds = variants.map((v: (typeof variants)[number]) => v.id);

  const grouped = variantIds.length
    ? await prisma.inventoryLedgerEntry.groupBy({
        by: ["variantId", "type"],
        where: { variantId: { in: variantIds } },
        _sum: { quantity: true },
      })
    : [];

  const sumsByVariant: Record<string, Partial<Record<string, number>>> = {};
  for (const g of grouped) {
    const vid = g.variantId;
    if (!sumsByVariant[vid]) sumsByVariant[vid] = {};
    sumsByVariant[vid][g.type] = g._sum.quantity ?? 0;
  }

  const rows = variants.map((v: (typeof variants)[number]) => {
    const sums = sumsByVariant[v.id] ?? {};
    const { onHand, reserved, available } = computeBalanceFromSums(sums);

    const customSkuCell = v.skuSource === "CUSTOM" ? v.sku : "";
    return {
      productSlug: v.product.slug,
      sizeCode: v.sizeOption.code,
      skuSource: v.skuSource,
      currentSku: v.sku,
      onHand,
      reserved,
      available,
      customSku: customSkuCell,
      qtyAction: "RECEIVE",
      qty: "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MDLB Inventory");

  const buf = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
  const uint8: Uint8Array = new Uint8Array(buf);
  const arrayBuffer = uint8.buffer as ArrayBuffer;

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${TEMPLATE_FILENAME}"`,
    },
  });
}

