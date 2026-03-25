import { describe, expect, it } from "vitest";

import { computeAutoSku, slugify } from "./sku";

describe("slugify", () => {
  it("slugifies basic names", () => {
    expect(slugify("MDLBEAST Tee")).toBe("mdlbeast-tee");
    expect(slugify("  MDLBEAST   Hoodie  ")).toBe("mdlbeast-hoodie");
  });

  it("removes special chars", () => {
    expect(slugify("MDLB / Tee (Black)")).toBe("mdlb-tee-black");
  });
});

describe("computeAutoSku", () => {
  it("uses skuPrefix if provided", () => {
    expect(
      computeAutoSku({ productSlug: "mdlbeast-tee", skuPrefix: "MDLB-TEE", sizeCode: "XL" }),
    ).toBe("MDLB-TEE-XL");
  });

  it("falls back to productSlug and normalizes size", () => {
    expect(
      computeAutoSku({ productSlug: "mdlbeast-tee", skuPrefix: null, sizeCode: "OneSize" }),
    ).toBe("MDLBEAST-TEE-ONESIZE");
  });
});

