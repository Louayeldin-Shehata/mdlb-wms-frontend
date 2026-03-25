import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getVariantBalance } from "@/lib/inventory";
import { requireAdminOrRedirect } from "@/lib/server-guards";

export default async function AdminRequestsPage() {
  await requireAdminOrRedirect();

  const requests = await prisma.crewRequest.findMany({
    where: { status: { in: ["SUBMITTED", "ACKNOWLEDGED"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      createdByUser: { select: { email: true } },
      lines: {
        select: {
          id: true,
          qtyRequested: true,
          qtyReserved: true,
          variantId: true,
          variant: {
            select: {
              sku: true,
              sizeOption: { select: { code: true } },
              product: { select: { name: true } },
            },
          },
        },
      },
    },
    take: 50,
  });

  const balancesByVariantId = new Map<string, Awaited<ReturnType<typeof getVariantBalance>>>();
  for (const r of requests) {
    for (const l of r.lines) {
      if (!balancesByVariantId.has(l.variantId)) {
        balancesByVariantId.set(l.variantId, await getVariantBalance(l.variantId));
      }
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Requests</h1>
          <p className="text-sm text-zinc-400">
            Acknowledge requests to reserve stock.
          </p>
        </div>
        <Link className="underline text-sm" href="/admin">
          Back to dashboard
        </Link>
      </div>

      <div className="space-y-4">
        {requests.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-white/10 bg-zinc-950 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{r.status}</div>
                <div className="text-xs text-zinc-400">
                  {r.createdAt.toISOString()} — {r.createdByUser.email}
                </div>
                {r.note ? (
                  <div className="text-sm text-zinc-400">{r.note}</div>
                ) : null}
              </div>
              <div className="flex gap-2">
                {r.status === "SUBMITTED" ? (
                  <>
                    <form action={`/api/admin/requests/${r.id}/ack`} method="post">
                      <button className="rounded-lg bg-black text-white px-3 py-2 text-sm font-medium">
                        Acknowledge (reserve)
                      </button>
                    </form>
                    <form action={`/api/admin/requests/${r.id}/reject`} method="post">
                      <button className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium">
                        Reject
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 overflow-hidden">
              <div className="grid grid-cols-5 bg-black/2 text-xs font-medium">
                <div className="p-3">Item</div>
                <div className="p-3">Size</div>
                <div className="p-3">SKU</div>
                <div className="p-3">Requested</div>
                <div className="p-3">Available</div>
              </div>
              <div className="divide-y divide-white/5 text-sm">
                {r.lines.map((l) => {
                  const bal = balancesByVariantId.get(l.variantId);
                  return (
                    <div key={l.id} className="grid grid-cols-5">
                      <div className="p-3 text-zinc-100">
                        {l.variant.product.name}
                      </div>
                      <div className="p-3 text-zinc-400">{l.variant.sizeOption.code}</div>
                      <div className="p-3 font-mono text-xs text-zinc-200">{l.variant.sku}</div>
                      <div className="p-3 text-zinc-100">
                        {l.qtyRequested}{" "}
                        {l.qtyReserved > 0 ? (
                          <span className="text-xs text-zinc-400">
                            (reserved {l.qtyReserved})
                          </span>
                        ) : null}
                      </div>
                      <div className="p-3">{bal ? bal.available : "-"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 ? (
          <div className="text-sm text-zinc-400">No pending requests.</div>
        ) : null}
      </div>
    </div>
  );
}

