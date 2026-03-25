import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireCrewOrRedirect } from "@/lib/server-guards";

export const runtime = "nodejs";

export default async function CrewRequestsPage() {
  const session = await requireCrewOrRedirect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session as any).user?.id as string | undefined;

  const requests = await prisma.crewRequest.findMany({
    where: { createdByUserId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      lines: {
        select: {
          id: true,
          qtyRequested: true,
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

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">My Requests</h1>
          <p className="text-sm text-zinc-400">Track request statuses.</p>
        </div>
        <div className="flex gap-3">
          <Link className="underline text-sm" href="/crew">
            Back to dashboard
          </Link>
          <Link
            className="rounded-lg bg-zinc-100/10 text-zinc-100 border border-white/10 px-4 py-2 text-sm font-medium"
            href="/crew/requests/new"
          >
            New request
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-white/10 bg-zinc-950 p-4 space-y-2"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm">
                <div className="font-medium">{r.status}</div>
                <div className="text-zinc-400 text-xs">{r.createdAt.toISOString()}</div>
              </div>
              <div className="text-xs font-mono text-zinc-400">{r.id}</div>
            </div>
            <div className="text-sm">
              {r.lines.map((l) => (
                <div key={l.id} className="flex justify-between gap-3">
                  <div className="text-zinc-300">
                    {l.variant.product.name} — {l.variant.sizeOption.code}
                  </div>
                  <div className="font-mono text-zinc-400">
                    x{l.qtyRequested} ({l.variant.sku})
                  </div>
                </div>
              ))}
            </div>
            {r.note ? (
              <div className="text-sm text-zinc-400">{r.note}</div>
            ) : null}
          </div>
        ))}
        {requests.length === 0 ? (
          <div className="text-sm text-zinc-400">No requests yet.</div>
        ) : null}
      </div>
    </div>
  );
}

