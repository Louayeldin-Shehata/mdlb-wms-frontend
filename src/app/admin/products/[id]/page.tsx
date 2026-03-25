import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdminOrRedirect } from "@/lib/server-guards";
import { VariantRow } from "./ui";
import { EditProductInfo } from "./edit-product-info";

export const runtime = "nodejs";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminOrRedirect();
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      skuPrefix: true,
      description: true,
      isActive: true,
      variants: {
        orderBy: { sizeOption: { sortOrder: "asc" } },
        select: {
          id: true,
          sku: true,
          skuSource: true,
          autoSku: true,
          sizeOption: { select: { code: true, label: true } },
          images: { select: { id: true, url: true, key: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!product) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-sm">Not found.</p>
      </div>
    );
  }

  const imageChoices = (() => {
    const all = product.variants.flatMap((v) => v.images);
    const map = new Map<string, { id: string; url: string; key: string }>();
    for (const img of all) {
      // Deduplicate by storage key so the dropdown doesn't get too long.
      if (!map.has(img.key)) map.set(img.key, img);
    }
    return Array.from(map.values());
  })();

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-zinc-400">
            Slug: <span className="font-mono">{product.slug}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link className="text-sm underline" href="/admin/products">
            Back
          </Link>
        </div>
      </div>

      <EditProductInfo
        productId={product.id}
        initialDescription={product.description}
        initialIsActive={product.isActive}
      />

      <div className="rounded-xl border border-white/10 overflow-hidden bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="bg-black/2">
            <tr>
              <th className="text-left font-medium p-3">Size</th>
              <th className="text-left font-medium p-3">SKU</th>
              <th className="text-left font-medium p-3">Source</th>
              <th className="text-left font-medium p-3">Auto SKU</th>
              <th className="text-left font-medium p-3">Images</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v) => (
              <VariantRow key={v.id} variant={v} imageChoices={imageChoices} />
            ))}
            {product.variants.length === 0 && (
              <tr>
                <td className="p-3 text-zinc-400" colSpan={6}>
                  No variants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

