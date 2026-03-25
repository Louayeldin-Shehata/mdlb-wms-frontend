"use client";

import { useMemo, useState } from "react";

type Props = {
  productId: string;
  initialDescription: string | null;
  initialIsActive: boolean;
};

export function EditProductInfo({ productId, initialDescription, initialIsActive }: Props) {
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isActive, setIsActive] = useState<"true" | "false">(
    initialIsActive ? "true" : "false",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    return true;
  }, [busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/update`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description: description.trim() ? description : null,
          isActive: isActive === "true",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
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
      className="rounded-xl border border-white/10 bg-zinc-950 p-4 space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-100">Edit product info</h2>
        <p className="text-sm text-zinc-400">
          Update description and active status for this product.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400">
          Description
        </label>
        <textarea
          className="min-h-[90px] w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          value={description}
          disabled={busy}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional product description"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-zinc-400">
          Active
        </label>
        <select
          className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          value={isActive}
          disabled={busy}
          onChange={(e) => setIsActive(e.target.value as "true" | "false")}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60 transition-transform duration-200 hover:-translate-y-[1px]"
      >
        {busy ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

