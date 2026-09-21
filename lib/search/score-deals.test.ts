import { describe, expect, it } from "vitest";
import { normalizeStatus, scoreDeals } from "./score-deals";
import type { ListingRecord } from "./types";

const base: ListingRecord = {
  id: "x", mlsNumber: "1", status: "Active", listPrice: null, dom: null, listDate: null,
  address: "1 A St", city: "Phoenix", state: "AZ", zip: "85018", subdivision: null,
  dwellingType: "Single Family", beds: null, baths: null, sqft: null, lotSqft: null,
  pool: null, interiorLevels: null, yearBuilt: null, latitude: null, longitude: null,
  ownerName: null, estimatedEquityPct: null, source: "reso",
};
const L = (o: Partial<ListingRecord>): ListingRecord => ({ ...base, ...o });

describe("normalizeStatus", () => {
  it("keeps today's precedence", () => {
    expect(normalizeStatus("Active Under Contract")).toBe("Active");
    expect(normalizeStatus("Pending")).toBe("Pending");
    expect(normalizeStatus("Coming Soon")).toBe("Coming Soon");
    expect(normalizeStatus("Withdrawn")).toBe("Canceled");
    expect(normalizeStatus("Closed")).toBe("Closed");
    expect(normalizeStatus("")).toBe("Off Market");
  });
});

describe("scoreDeals", () => {
  it("flags a listing at 60% of a property-estimate ARV as Target now", () => {
    const [d] = scoreDeals([L({ listPrice: 300000, estimatedArv: 500000 })], 70);
    expect(d.listToArvPct).toBe(60);
    expect(d.dealScore).toBe(60);
    expect(d.priority).toBe("Target now");
    expect(d.arvSource).toBe("Property estimate");
    expect(d.reasons).toContain("60% of projected ARV");
  });

  it("returns Low / Insufficient data with no price or sqft", () => {
    const [d] = scoreDeals([L({})], 70);
    expect(d.arv).toBeNull();
    expect(d.arvSource).toBe("Insufficient data");
    expect(d.dealScore).toBe(0);
    expect(d.priority).toBe("Low");
  });

  it("scores 75% of ARV under a 70% threshold as +32 only", () => {
    const [d] = scoreDeals([L({ listPrice: 375000, estimatedArv: 500000 })], 70);
    expect(d.dealScore).toBe(32);
    expect(d.priority).toBe("Low");
  });

  it("adds 12 for distress language", () => {
    const [d] = scoreDeals([L({ distressSignal: true })], 70);
    expect(d.dealScore).toBe(12);
    expect(d.reasons).toContain("Fixer / condition language");
  });

  it("models ARV from the zip/type $/sqft median when no estimate", () => {
    const out = scoreDeals([
      L({ id: "a", listPrice: 200000, sqft: 1000 }),
      L({ id: "b", listPrice: 300000, sqft: 1000 }),
    ], 70);
    const a = out.find((x) => x.id === "a")!;
    expect(a.arvSource).toBe("Pocket $/sqft model");
    expect(a.arv).toBe(250000);
    expect(a.dealScore).toBe(42);
    expect(a.priority).toBe("Watch");
    expect(out[0].id).toBe("a"); // sorted by score desc
  });
});
