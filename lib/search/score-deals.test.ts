import { describe, expect, it } from "vitest";
import { normalizeStatus, scoreDeals } from "./score-deals";
import type { ArvEstimate } from "./comps";
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
  it("routes RESO statuses into the Search buckets", () => {
    expect(normalizeStatus("Active")).toBe("Active");
    expect(normalizeStatus("Active Under Contract")).toBe("Under Contract");
    expect(normalizeStatus("UCB (Under Contract-Backups)")).toBe("Under Contract");
    expect(normalizeStatus("Hold")).toBe("Canceled");
    expect(normalizeStatus("Delete")).toBe("Deleted");
    expect(normalizeStatus("Pending")).toBe("Pending");
    expect(normalizeStatus("Coming Soon")).toBe("Coming Soon");
    expect(normalizeStatus("Withdrawn")).toBe("Canceled");
    expect(normalizeStatus("Closed")).toBe("Closed");
    expect(normalizeStatus("")).toBe("Off Market");
  });
});

const est = (arv: number, confidence: "High" | "Medium" | "Low"): ArvEstimate => ({ arv, pricePerSqft: arv / 1000, method: "Sold comps", confidence, compCount: 6, radiusMiles: 0.5, sameSubdivision: false, monthsBack: 6, comps: [] });

describe("scoreDeals with sold-comps ARV", () => {
  it("prefers the sold-comps ARV over a property estimate", () => {
    const [d] = scoreDeals([L({ listPrice: 280000, sqft: 1000, estimatedArv: 900000 })], 70, () => est(400000, "High"));
    expect(d.arv).toBe(400000);
    expect(d.arvSource).toBe("Sold comps");
    expect(d.arvConfidence).toBe("High");
    expect(d.listToArvPct).toBe(70);
    expect(d.priority).toBe("Target now");
  });

  it("never marks a low-confidence ARV as Target now", () => {
    const [d] = scoreDeals([L({ listPrice: 200000, sqft: 1000 })], 70, () => est(400000, "Low"));
    expect(d.listToArvPct).toBe(50);
    expect(d.priority).not.toBe("Target now");
    expect(d.reasons[0]).toBe("50% of rough ARV (verify)");
  });

  it("never marks the asking-price pocket model as Target now", () => {
    const out = scoreDeals([L({ id: "a", listPrice: 100000, sqft: 1000 }), L({ id: "b", listPrice: 400000, sqft: 1000 })], 70);
    expect(out.find((x) => x.id === "a")!.arvConfidence).toBe("Low");
    expect(out.every((x) => x.priority !== "Target now")).toBe(true);
  });

  it("flags far-below-comps prices as suspect data instead of Target now", () => {
    const [d] = scoreDeals([L({ listPrice: 100000, sqft: 1000 })], 70, () => est(400000, "High"));
    expect(d.listToArvPct).toBe(25);
    expect(d.priority).not.toBe("Target now");
    expect(d.reasons[0]).toBe("25% of ARV — verify sqft/data");
  });

  it("judges Closed rows on sold price and does not rank them", () => {
    const [d] = scoreDeals([L({ status: "Closed", listPrice: 300000, closePrice: 240000, sqft: 1000 })], 70, () => est(400000, "High"));
    expect(d.listToArvPct).toBe(60);
    expect(d.dealScore).toBe(0);
    expect(d.priority).toBe("Low");
    expect(d.reasons).toEqual(["Sold at 60% of ARV"]);
  });

  it("caps Pending / Under Contract at Watch", () => {
    for (const status of ["Pending", "Active Under Contract"]) {
      const [d] = scoreDeals([L({ status, listPrice: 200000, sqft: 1000 })], 70, () => est(400000, "High"));
      expect(d.priority).toBe("Watch");
    }
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
    expect(a.reasons[0]).toBe("80% of rough ARV (verify)");
    expect(out[0].id).toBe("a"); // sorted by score desc
  });
});
