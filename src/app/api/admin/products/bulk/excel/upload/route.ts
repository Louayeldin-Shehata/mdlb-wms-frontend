import * as XLSX from "xlsx";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { computeAutoSku } from "@/lib/sku";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

export const runtime = "nodejs";

type QtyTxnType = "RECEIVE" | "ADJUST";

type ExcelRow = {
  productSlug?: string;
  sizeCode?: string;
  customSku?: string;
  qtyAction?: string;
  qty?: string | number;
  note?: string;
};

function normalizeKey(k: string) {
  return k.toLowerCase().replace(/\s+/g, "").trim();
}

function getString(obj: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function parseIntSafe(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") {
    if (!Number.isInteger(v)) return Math.trunc(v);
    return v;
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return Number.isInteger(n) ? n : Math.trunc(n);
  }
  return null;
}

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

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response("Missing file", { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return new Response("Only .xlsx files are supported", { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buf, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return new Response("Missing worksheet", { status: 400 });

  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  }) as Record<string, unknown>[];

  const normalizedRows: ExcelRow[] = rawRows.map((r: Record<string, unknown>) => {
    // normalize keys for flexible header names
    const nk: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(r)) {
      nk[normalizeKey(key)] = value;
    }

    const productSlug = getString(nk, ["productslug", "product", "productid", "product_slug"]);
    const sizeCode = getString(nk, ["sizecode", "size", "size_code"]);
    const customSku = getString(nk, ["customsku", "customsku", "customsku ", "custom_sku", "customsku"]);

    const qtyAction = getString(nk, [
      "qtyaction",
      "qtyaction",
      "action",
      "type",
      "qtytype",
      "transactiontype",
    ]);

    const qtyRaw =
      nk[normalizeKey("qty")] ??
      nk[normalizeKey("quantity")] ??
      nk[normalizeKey("qtyquantity")] ??
      nk[normalizeKey("Qty")] ??
      nk[normalizeKey("quantity")];

    const qty =
      typeof qtyRaw === "string" || typeof qtyRaw === "number" ? qtyRaw : undefined;
    const note = getString(nk, ["note", "notes", "txnnote"]);

    return {
      productSlug,
      sizeCode,
      customSku,
      qtyAction,
      qty,
      note,
    };
  });

  const validRows = normalizedRows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => row.productSlug && row.sizeCode) as {
    row: ExcelRow;
    idx: number;
  }[];

  const errors: { rowIndex: number; message: string }[] = [];

  const productSlugs = Array.from(
    new Set(
      validRows.map((r: (typeof validRows)[number]) => r.row.productSlug as string),
    ),
  );
  const sizeCodes = Array.from(
    new Set(validRows.map((r: (typeof validRows)[number]) => r.row.sizeCode as string)),
  );

  const products = await prisma.product.findMany({
    where: { slug: { in: productSlugs } },
    select: { id: true, slug: true, skuPrefix: true },
  });
  const sizes = await prisma.sizeOption.findMany({
    where: { code: { in: sizeCodes } },
    select: { id: true, code: true },
  });

  const productBySlug = new Map<string, (typeof products)[number]>(
    products.map((p: (typeof products)[number]) => [p.slug, p]),
  );
  const sizeByCode = new Map<string, (typeof sizes)[number]>(
    sizes.map((s: (typeof sizes)[number]) => [s.code, s]),
  );

  const productIds = products.map((p: (typeof products)[number]) => p.id);
  const sizeIds = sizes.map((s: (typeof sizes)[number]) => s.id);

  const variants = await prisma.productVariant.findMany({
    where: { productId: { in: productIds }, sizeOptionId: { in: sizeIds } },
    select: {
      id: true,
      productId: true,
      sizeOptionId: true,
      skuSource: true,
      sku: true,
    },
  });

  const variantByKey = new Map<string, (typeof variants)[number]>();
  for (const v of variants) {
    variantByKey.set(`${v.productId}:${v.sizeOptionId}`, v);
  }

  const createdByUserId = (
    session as unknown as { user?: { id?: string } }
  ).user?.id;

  let skuUpdated = 0;
  let qtyApplied = 0;

  for (const { row, idx } of validRows) {
    const productSlug = row.productSlug as string;
    const sizeCode = row.sizeCode as string;

    const product = productBySlug.get(productSlug);
    const size = sizeByCode.get(sizeCode);
    if (!product) {
      errors.push({ rowIndex: idx + 2, message: `Unknown productSlug: ${productSlug}` });
      continue;
    }
    if (!size) {
      errors.push({ rowIndex: idx + 2, message: `Unknown sizeCode: ${sizeCode}` });
      continue;
    }

    const variant = variantByKey.get(`${product.id}:${size.id}`);
    if (!variant) {
      errors.push({
        rowIndex: idx + 2,
        message: `Variant not found for ${productSlug} + ${sizeCode}`,
      });
      continue;
    }

    // SKU update:
    const customSkuRaw = typeof row.customSku === "string" ? row.customSku.trim() : "";
    const wantsCustom = customSkuRaw.length > 0;

    const autoSku = computeAutoSku({
      productSlug,
      skuPrefix: product.skuPrefix ?? null,
      sizeCode,
    });

    const desiredSkuSource = wantsCustom ? "CUSTOM" : "AUTO";
    const desiredSku = wantsCustom ? customSkuRaw : autoSku;

    const skuNeedsUpdate =
      variant.skuSource !== desiredSkuSource || (desiredSkuSource === "CUSTOM" && variant.sku !== desiredSku);

    if (skuNeedsUpdate) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data:
          desiredSkuSource === "AUTO"
            ? { skuSource: "AUTO", autoSku, sku: autoSku }
            : { skuSource: "CUSTOM", autoSku, sku: desiredSku },
      });
      skuUpdated += 1;
    }

    // Qty update:
    const qtyInt = parseIntSafe(row.qty);
    if (qtyInt === null) continue;

    let qtyType: QtyTxnType = "RECEIVE";
    const qa = typeof row.qtyAction === "string" ? row.qtyAction.trim().toUpperCase() : "";
    if (qa) {
      if (qa !== "RECEIVE" && qa !== "ADJUST") {
        errors.push({
          rowIndex: idx + 2,
          message: `Invalid qtyAction: ${row.qtyAction}. Use RECEIVE or ADJUST.`,
        });
        continue;
      }
      qtyType = qa as QtyTxnType;
    } else {
      qtyType = "RECEIVE";
    }

    if (qtyType === "RECEIVE" && qtyInt <= 0) {
      errors.push({
        rowIndex: idx + 2,
        message: `RECEIVE qty must be > 0 (got ${qtyInt})`,
      });
      continue;
    }
    if (qtyType === "ADJUST" && qtyInt === 0) {
      continue;
    }

    await prisma.inventoryLedgerEntry.create({
      data: {
        variantId: variant.id,
        type: qtyType,
        quantity: qtyInt,
        note: typeof row.note === "string" && row.note.trim() ? row.note.trim() : undefined,
        createdByUserId: createdByUserId ?? null,
      },
    });
    qtyApplied += 1;
  }

  return Response.json({
    ok: errors.length === 0,
    skuUpdated,
    qtyApplied,
    errorCount: errors.length,
    errors,
  });
}

