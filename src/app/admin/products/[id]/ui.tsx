"use client";

import { useMemo, useState } from "react";

type Variant = {
  id: string;
  sku: string;
  skuSource: "AUTO" | "CUSTOM";
  autoSku: string | null;
  sizeOption: { code: string; label: string };
  images: { id: string; url: string; key: string }[];
};

type ImageChoice = { id: string; url: string; key: string };

export function VariantRow({
  variant,
  imageChoices,
}: {
  variant: Variant;
  imageChoices: ImageChoice[];
}) {
  const [customSku, setCustomSku] = useState(
    variant.skuSource === "CUSTOM" ? variant.sku : "",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedExistingImageId, setSelectedExistingImageId] = useState<
    string | "none"
  >("none");

  const coverUrl = useMemo(() => variant.images[0]?.url, [variant.images]);

  async function saveSku() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/variants/${variant.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customSku: customSku || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File) {
    setErr(null);
    setBusy(true);
    try {
      const presignRes = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentType: file.type, folder: "variants" }),
      });
      if (!presignRes.ok) throw new Error(await presignRes.text());
      const presign = (await presignRes.json()) as {
        key: string;
        url: string;
        publicUrl?: string;
      };

      const putRes = await fetch(presign.url, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");

      const createRes = await fetch(`/api/admin/variants/${variant.id}/images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: presign.key,
          url: presign.publicUrl || presign.key,
        }),
      });
      if (!createRes.ok) throw new Error(await createRes.text());

      window.location.reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-t border-white/5 align-top">
      <td className="p-3">
        <div className="font-medium">{variant.sizeOption.code}</div>
        <div className="text-xs text-zinc-400">{variant.sizeOption.label}</div>
      </td>
      <td className="p-3 font-mono text-xs">{variant.sku}</td>
      <td className="p-3">{variant.skuSource}</td>
      <td className="p-3 font-mono text-xs text-zinc-400">
        {variant.autoSku ?? "-"}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md border border-white/10 bg-black/2 overflow-hidden">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm underline cursor-pointer">
              Upload
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadImage(f);
                }}
              />
            </label>

            {imageChoices.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
                  value={selectedExistingImageId}
                  disabled={busy}
                  onChange={(e) => setSelectedExistingImageId(e.target.value as string)}
                >
                  <option value="none">Use existing</option>
                  {imageChoices.map((img) => (
                    <option key={img.id} value={img.id}>
                      {img.id.slice(0, 6)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy || selectedExistingImageId === "none"}
                  onClick={async () => {
                    setErr(null);
                    setBusy(true);
                    try {
                      const chosen = imageChoices.find(
                        (i) => i.id === selectedExistingImageId,
                      );
                      if (!chosen) throw new Error("No image selected");

                      const createRes = await fetch(
                        `/api/admin/variants/${variant.id}/images`,
                        {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            key: chosen.key,
                            url: chosen.url,
                          }),
                        },
                      );
                      if (!createRes.ok) throw new Error(await createRes.text());
                      window.location.reload();
                    } catch (e) {
                      setErr((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="rounded-lg bg-zinc-100/10 border border-white/10 px-3 py-2 text-sm font-medium text-zinc-100 disabled:opacity-60"
                >
                  Attach
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </td>
      <td className="p-3 space-y-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-400">
            Custom SKU (optional)
          </label>
          <input
            className="w-[220px] rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-100"
            value={customSku}
            onChange={(e) => setCustomSku(e.target.value)}
            placeholder="Leave blank for AUTO"
            disabled={busy}
          />
        </div>
        <button
          type="button"
          onClick={() => void saveSku()}
          disabled={busy}
          className="rounded-lg bg-black text-white px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {busy ? "Saving..." : "Save"}
        </button>
        {err ? <div className="text-xs text-red-400">{err}</div> : null}
      </td>
    </tr>
  );
}

