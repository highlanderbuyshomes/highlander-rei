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

const est = (arv: number, confidence: "High" | "Medium" | "Low", rangePct = 10): ArvEstimate => ({ arv, pricePerSqft: arv / 1000, method: "Sold comps", basis: "All sales", confidence, compCount: 6, radiusMiles: 0.5, sameSubdivision: false, monthsBack: 6, comps: [], rangePct });

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

  it("shows no ARV when the price/ARV ratio is implausible (bad data)", () => {
    for (const listPrice of [100000, 1300000]) {
      const [d] = scoreDeals([L({ listPrice, sqft: 1000 })], 70, () => est(400000, "High"));
      expect(d.arv).toBeNull();
      expect(d.listToArvPct).toBeNull();
      expect(d.arvSource).toBe("Insufficient data");
      expect(d.priority).not.toBe("Target now");
    }
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

  it("adds 12 for motivated-seller language", () => {
    const [d] = scoreDeals([L({ motivatedSignal: true })], 70);
    expect(d.dealScore).toBe(12);
    expect(d.reasons).toContain("Motivated seller language");
  });

  it("adds 10 for fixer/condition language", () => {
    const [d] = scoreDeals([L({ distressSignal: true })], 70);
    expect(d.dealScore).toBe(10);
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

  it("scores are whole numbers", () => {
    const [d] = scoreDeals([L({ listPrice: 263000, sqft: 1000 })], 70, () => est(400000, "High"));
    expect(Number.isInteger(d.dealScore)).toBe(true);
  });

  it("judges a wide-range ARV at its conservative end: 65% of a ±22% ARV is not Target now", () => {
    const [d] = scoreDeals([L({ listPrice: 650_000, sqft: 1000 })], 70, () => est(1_000_000, "High", 22));
    expect(d.listToArvPct).toBe(65); // what's shown stays the plain % of ARV
    expect(d.arvRangePct).toBe(22);
    expect(d.conservativeArv).toBe(880_000); // 12 points of range beyond the normal ±10%
    expect(d.rule70Price).toBe(616_000); // max offer from the conservative ARV
    expect(d.priority).not.toBe("Target now");
    expect(d.reasons[0]).toBe("65% of projected ARV (74% at the low end)");
  });

  it("leaves a normal-range ARV alone", () => {
    const [d] = scoreDeals([L({ listPrice: 270_000, sqft: 1000 })], 70, () => est(400_000, "High", 10));
    expect(d.conservativeArv).toBe(400_000);
    expect(d.rule70Price).toBe(280_000);
    expect(d.priority).toBe("Target now");
    expect(d.reasons[0]).toBe("68% of projected ARV");
  });

  it("adds score and a reason when listed at or below 90% of the clean as-is value", () => {
    const asIs = () => ({ value: 350_000, pricePerSqft: 350, compCount: 5, radiusMiles: 0.5, sameSubdivision: false, rangePct: 10, comps: [] });
    const [plain] = scoreDeals([L({ listPrice: 300_000, sqft: 1000 })], 70, () => est(400_000, "High"));
    const [d] = scoreDeals([L({ listPrice: 300_000, sqft: 1000 })], 70, () => est(400_000, "High"), asIs);
    expect(d.asIsValue).toBe(350_000);
    expect(Math.round(d.pctOfAsIs!)).toBe(86);
    expect(d.reasons).toContain("86% of clean as-is");
    expect(d.dealScore).toBe(Math.min(99, plain.dealScore + 16)); // 12 + (90 − 85.7)
  });

  it("gives no as-is bonus above 90% or on a closed sale", () => {
    const asIs = () => ({ value: 350_000, pricePerSqft: 350, compCount: 5, radiusMiles: 0.5, sameSubdivision: false, rangePct: 10, comps: [] });
    const [near] = scoreDeals([L({ listPrice: 330_000, sqft: 1000 })], 70, () => est(400_000, "High"), asIs);
    expect(near.reasons.join()).not.toContain("clean as-is");
    const [sold] = scoreDeals([L({ status: "Closed", listPrice: 300_000, closePrice: 300_000, sqft: 1000 })], 70, () => est(400_000, "High"), asIs);
    expect(sold.reasons.join()).not.toContain("clean as-is");
    expect(Math.round(sold.pctOfAsIs!)).toBe(86); // still shown
  });
});
