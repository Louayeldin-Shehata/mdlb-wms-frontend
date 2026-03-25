"use client";

import { useState } from "react";

export function CreateProductForm() {
  const [name, setName] = useState("");
  const [skuPrefix, setSkuPrefix] = useState("");
  const [sizeScheme, setSizeScheme] = useState<"S_XXXL" | "OS">("S_XXXL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          skuPrefix: skuPrefix || null,
          sizeCodes:
            sizeScheme === "OS"
              ? ["OneSize"]
              : ["S", "M", "L", "XL", "XXL", "XXXL"],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName("");
      setSkuPrefix("");
      setSizeScheme("S_XXXL");
      // Refresh server components list
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-white/10 bg-zinc-950 p-4 space-y-3"
    >
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px] space-y-1">
          <label className="text-xs font-medium text-zinc-400">Product name</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="MDLBEAST Tee"
            required
          />
        </div>
        <div className="w-[220px] space-y-1">
          <label className="text-xs font-medium text-zinc-400">SKU prefix (optional)</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            value={skuPrefix}
            onChange={(e) => setSkuPrefix(e.target.value)}
            placeholder="MDLB-TEE"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {busy ? "Creating..." : "Create product"}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setSizeScheme("S_XXXL")}
          className={[
            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            sizeScheme === "S_XXXL"
              ? "border-white/30 bg-zinc-100/10 text-zinc-100"
              : "border-white/10 bg-zinc-950/0 text-zinc-100/80 hover:bg-zinc-900/30",
          ].join(" ")}
        >
          S - XXXL
        </button>

        <button
          type="button"
          onClick={() => setSizeScheme("OS")}
          className={[
            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            sizeScheme === "OS"
              ? "border-white/30 bg-zinc-100/10 text-zinc-100"
              : "border-white/10 bg-zinc-950/0 text-zinc-100/80 hover:bg-zinc-900/30",
          ].join(" ")}
        >
          OS (One Size)
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-zinc-500">
        Creates variants for the selected size scheme automatically.
      </p>
    </form>
  );
}

