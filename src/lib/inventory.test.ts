import { describe, expect, it } from "vitest";

import { computeBalanceFromSums } from "./inventoryMath";

describe("computeBalanceFromSums", () => {
  it("computes onHand/reserved/available", () => {
    const bal = computeBalanceFromSums({
      RECEIVE: 100,
      ADJUST: -5,
      RESERVE: 20,
      RELEASE: 3,
      FULFILL: 10,
    });
    // onHand = 100 + (-5) - 10 = 85
    expect(bal.onHand).toBe(85);
    // reserved = 20 - 3 = 17
    expect(bal.reserved).toBe(17);
    // available = 85 - 17 = 68
    expect(bal.available).toBe(68);
  });

  it("defaults missing sums to 0", () => {
    const bal = computeBalanceFromSums({});
    expect(bal.onHand).toBe(0);
    expect(bal.reserved).toBe(0);
    expect(bal.available).toBe(0);
  });
});

