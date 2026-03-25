"use client";

import { useState } from "react";

export function BulkInventoryExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/products/bulk/excel/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            skuUpdated?: number;
            qtyApplied?: number;
            errorCount?: number;
            errors?: { message: string }[];
          }
        | null;

      if (!res.ok) {
        throw new Error(data?.errors?.[0]?.message || (await res.text()));
      }

      if (data?.ok) {
        setMessage(
          `Applied updates successfully. SKU updated: ${data.skuUpdated ?? 0}, Qty applied: ${
            data.qtyApplied ?? 0
          }.`,
        );
      } else {
        const first = data?.errors?.[0]?.message;
        setError(
          `Upload processed with ${data?.errorCount ?? 0} error(s).${first ? ` First error: ${first}` : ""}`,
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-100">
          Bulk upload / update (Excel)
        </h2>
        <p className="text-sm text-zinc-400">
          Download the template, edit SKUs and Qty, then upload it here.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <a
          className="inline-flex items-center justify-center rounded-lg bg-zinc-100/10 border border-white/10 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-100/15 hover:border-white/30"
          href="/api/admin/products/bulk/excel/template"
        >
          Download template
        </a>
      </div>

      <form onSubmit={onUpload} className="space-y-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px] space-y-1">
            <label className="text-xs font-medium text-zinc-400">
              Upload .xlsx file
            </label>
            <input
              type="file"
              accept=".xlsx"
              disabled={busy}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full"
            />
          </div>
          <button
            type="submit"
            disabled={!file || busy}
            className="inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60 transition-transform duration-200 hover:-translate-y-[1px]"
          >
            {busy ? "Uploading..." : "Upload"}
          </button>
        </div>
        {message ? <p className="text-sm text-zinc-100">{message}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>
    </div>
  );
}

