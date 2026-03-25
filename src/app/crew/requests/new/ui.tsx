"use client";

import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  variants: {
    id: string;
    sku: string;
    sizeOption: { code: string; label: string; sortOrder: number };
  }[];
};

export function CrewRequestForm({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const [qty, setQty] = useState<Record<string, number>>({});

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const lines = Object.entries(qty)
        .filter(([, q]) => Number.isFinite(q) && q > 0)
        .map(([variantId, q]) => ({ variantId, qtyRequested: q }));

      if (!productId) throw new Error("Choose a product");
      if (lines.length === 0) throw new Error("Enter at least one quantity");

      const res = await fetch("/api/crew/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: note || null, lines }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = "/crew/requests";
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="min-w-[260px] flex-1 space-y-1">
          <label className="text-xs font-medium text-zinc-400">Product</label>
          <select
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setQty({});
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[260px] flex-1 space-y-1">
          <label className="text-xs font-medium text-zinc-400">Note (optional)</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Event, location, date..."
          />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 overflow-hidden">
        <div className="grid grid-cols-3 bg-black/2 text-xs font-medium">
          <div className="p-3">Size</div>
          <div className="p-3">SKU</div>
          <div className="p-3">Qty</div>
        </div>
        <div className="divide-y divide-white/5">
          {product?.variants.map((v) => (
            <div key={v.id} className="grid grid-cols-3 items-center">
              <div className="p-3">
                <div className="font-medium">{v.sizeOption.code}</div>
                <div className="text-xs text-zinc-400">{v.sizeOption.label}</div>
              </div>
              <div className="p-3 font-mono text-xs text-zinc-200">{v.sku}</div>
              <div className="p-3">
                <input
                  type="number"
                  min={0}
                  className="w-24 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  value={qty[v.id] ?? 0}
                  onChange={(e) =>
                    setQty((prev) => ({
                      ...prev,
                      [v.id]: Number.parseInt(e.target.value || "0", 10) || 0,
                    }))
                  }
                />
              </div>
            </div>
          ))}
          {product?.variants.length === 0 ? (
            <div className="p-3 text-sm text-zinc-400">No variants available.</div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {err ? <div className="text-sm text-red-400">{err}</div> : <div />}
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded-lg bg-zinc-100/10 border border-white/10 text-zinc-100 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {busy ? "Submitting..." : "Submit request"}
        </button>
      </div>
    </div>
  );
}

