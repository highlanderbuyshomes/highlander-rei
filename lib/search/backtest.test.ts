import { describe, expect, it } from "vitest";
import { scoreSample, summarizeErrors, valueTier } from "./backtest";

describe("summarizeErrors", () => {
  it("reports median miss, bias, hit rates and the p70 range", () => {
    // errors as fractions of the actual price
    const s = summarizeErrors([-0.02, 0.04, -0.08, 0.12, 0.2]);
    expect(s).toEqual({ n: 5, medianMiss: 8, bias: 4, within5: 40, within10: 60, within15: 80, p70: 8 });
  });
  it("is null for no data", () => {
    expect(summarizeErrors([])).toBeNull();
  });
});

describe("valueTier", () => {
  it("buckets by estimated value", () => {
    expect([valueTier(250e3), valueTier(300e3), valueTier(449_999), valueTier(450e3), valueTier(700e3)]).toEqual(["<300k", "300-450k", "300-450k", "450-700k", "700k+"]);
  });
});

describe("scoreSample", () => {
  it("scores a sold sample against its price", () => {
    expect(scoreSample({ status: "sold", price: 410_000, priceHigh: null }, 404_183)).toEqual({ missPct: -1.4, counted: true });
  });
  it("uses the middle of a pending offer range, and never counts pending", () => {
    expect(scoreSample({ status: "pending", price: 450_000, priceHigh: 460_000 }, 392_107)).toEqual({ missPct: -13.8, counted: false });
  });
  it("has no miss without an estimate", () => {
    expect(scoreSample({ status: "sold", price: 355_000, priceHigh: null }, null)).toEqual({ missPct: null, counted: false });
  });
});
