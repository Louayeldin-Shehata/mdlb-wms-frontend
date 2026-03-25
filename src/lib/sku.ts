export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function computeAutoSku(opts: {
  productSlug: string;
  skuPrefix?: string | null;
  sizeCode: string;
}): string {
  const base = (opts.skuPrefix || opts.productSlug).trim();
  const normalizedBase = base
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const size = opts.sizeCode.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return `${normalizedBase}-${size}`;
}

