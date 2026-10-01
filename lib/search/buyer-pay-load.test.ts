import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { ibCacheKey, ibPropertyTypes } from "./buyer-pay-load";

describe("ibPropertyTypes", () => {
  it("maps our dwelling classes to InvestorBase property types", () => {
    expect(ibPropertyTypes("Single Family")).toEqual(["SFR"]);
    expect(ibPropertyTypes("Condo")).toEqual(["CONDO"]);
    expect(ibPropertyTypes("Townhouse")).toEqual(["SFR", "CONDO"]);
    expect(ibPropertyTypes("Patio Home")).toEqual(["SFR", "CONDO"]);
    expect(ibPropertyTypes("Manufactured")).toEqual(["MOBILE"]);
    expect(ibPropertyTypes("Multi-Family")).toEqual(["MFR"]);
  });
});

describe("ibCacheKey", () => {
  it("is stable for the same request regardless of key order and tiny coordinate noise", () => {
    const a = ibCacheKey("/v1/analytics-summary", { latitude: 33.4210031, longitude: -112.1981482, lookback_months: 24 });
    const b = ibCacheKey("/v1/analytics-summary", { lookback_months: 24, longitude: -112.198148, latitude: 33.421003 });
    expect(a).toBe(b);
    expect(ibCacheKey("/v1/investor-comps", { latitude: 33.421003, longitude: -112.198148 })).not.toBe(a);
  });
});
