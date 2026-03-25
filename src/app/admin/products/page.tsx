import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdminOrRedirect } from "@/lib/server-guards";
import { CreateProductForm } from "./ui";
import { BulkInventoryExcel } from "./bulk-inventory-excel";

export const runtime = "nodejs";

export default async function AdminProductsPage() {
  await requireAdminOrRedirect();

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, isActive: true, createdAt: true },
    take: 100,
  });

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-zinc-400">Create and manage merch items.</p>
        </div>
        <Link className="text-sm underline" href="/admin">
          Back to dashboard
        </Link>
      </div>

      <CreateProductForm />

      <BulkInventoryExcel />

      <div className="rounded-xl border border-white/10 overflow-hidden bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="bg-black/2">
            <tr>
              <th className="text-left font-medium p-3">Name</th>
              <th className="text-left font-medium p-3">Slug</th>
              <th className="text-left font-medium p-3">Active</th>
              <th className="text-left font-medium p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="p-3 text-zinc-100">{p.name}</td>
                <td className="p-3 text-zinc-400">{p.slug}</td>
                <td className="p-3">{p.isActive ? "Yes" : "No"}</td>
                <td className="p-3 text-right">
                  <Link className="underline" href={`/admin/products/${p.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td className="p-3 text-zinc-400" colSpan={4}>
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

