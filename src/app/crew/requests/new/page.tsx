import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireCrewOrRedirect } from "@/lib/server-guards";
import { CrewRequestForm } from "./ui";

export const runtime = "nodejs";

export default async function NewCrewRequestPage() {
  await requireCrewOrRedirect();

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      variants: {
        orderBy: { sizeOption: { sortOrder: "asc" } },
        select: {
          id: true,
          sku: true,
          sizeOption: { select: { code: true, label: true, sortOrder: true } },
        },
      },
    },
    take: 100,
  });

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">New Request</h1>
          <p className="text-sm text-zinc-400">
            Select a product and enter quantities per size.
          </p>
        </div>
        <Link className="underline text-sm" href="/crew">
          Back to dashboard
        </Link>
      </div>

      <CrewRequestForm products={products} />
    </div>
  );
}

