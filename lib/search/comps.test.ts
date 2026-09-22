import { describe, expect, it } from "vitest";
import { buildCompIndex, estimateArv, milesBetween, percentile, subdivisionKey, type ArvSubject, type ClosedComp } from "./comps";

const NOW = Date.parse("2026-09-22T00:00:00Z");
const DAY = 24 * 3600_000;
// ~0.09 mi per 0.0013 degrees of latitude
const comp = (i: number, o: Partial<ClosedComp> = {}): ClosedComp => ({
  id: `c${i}`, lat: 33.5 + i * 0.0013, lng: -112, sqft: 1500, beds: 3, yearBuilt: 1985,
  dwelling: "Single Family", zip: "85018", subdivision: null, price: 300000 + i * 15000, closedAt: NOW - 30 * DAY,
  address: `${i} Comp St`, city: "Phoenix", ...o,
});
const subject: ArvSubject = { id: "s", latitude: 33.5, longitude: -112, sqft: 1500, beds: 3, yearBuilt: 1985, dwellingType: "Single Family", zip: "85018" };

describe("helpers", () => {
  it("percentile interpolates", () => {
    expect(percentile([100, 200, 300, 400, 500], 0.75)).toBe(400);
    expect(percentile([100, 200], 0.75)).toBe(175);
    expect(percentile([], 0.5)).toBeNull();
  });
  it("milesBetween ~69 mi per degree of latitude", () => {
    expect(milesBetween(33, -112, 34, -112)).toBeCloseTo(69.1, 0);
  });
});

describe("estimateArv", () => {
  it("uses the median $/sqft of the nearest comps when there are fewer than 6", () => {
    const index = buildCompIndex([1, 2, 3, 4, 5].map((i) => comp(i)));
    const e = estimateArv(subject, index, NOW)!;
    expect(e.method).toBe("Sold comps");
    expect(e.compCount).toBe(5);
    expect(e.radiusMiles).toBe(0.5); // only 2 comps inside 0.25 mi
    expect(e.confidence).toBe("High");
    // $/sqft 210,220,230,240,250 -> median 230
    expect(e.pricePerSqft).toBeCloseTo(230, 6);
    expect(e.arv).toBe(345000);
    expect(e.comps[0].id).toBe("c1");
  });

  it("uses the upper quartile with 6+ comps", () => {
    const index = buildCompIndex([1, 2, 3, 4, 5, 6].map((i) => comp(i, { lat: 33.5 + i * 0.0005 })));
    const e = estimateArv(subject, index, NOW)!;
    expect(e.radiusMiles).toBe(0.25);
    // $/sqft 210..260 step 10 -> P75 = 247.5
    expect(e.pricePerSqft).toBeCloseTo(247.5, 6);
  });

  it("drops a luxury outlier instead of letting it set the ARV", () => {
    const index = buildCompIndex([comp(1, { price: 300000 }), comp(2, { price: 330000 }), comp(3, { price: 315000 }), comp(4, { price: 1100000 })]);
    const e = estimateArv(subject, index, NOW)!;
    expect(e.compCount).toBe(3);
    expect(e.arv).toBe(315000);
  });

  it("widens radius/look-back and lowers confidence when comps are sparse", () => {
    const far = [1, 2, 3].map((i) => comp(i, { lat: 33.5 + 0.02 + i * 0.001, closedAt: NOW - 250 * DAY }));
    const e = estimateArv(subject, buildCompIndex(far), NOW)!;
    expect(e.radiusMiles).toBe(2);
    expect(e.monthsBack).toBe(12);
    expect(e.confidence).toBe("Low");
  });

  it("rejects dissimilar comps (type, size, beds, age) and the subject itself", () => {
    const bad = [
      comp(1, { dwelling: "Condo" }), comp(2, { sqft: 2500 }), comp(3, { beds: 6 }), comp(4, { yearBuilt: 2022 }),
      comp(5, { id: "s" }), comp(6, { closedAt: NOW - 400 * DAY }),
    ];
    expect(estimateArv(subject, buildCompIndex(bad), NOW)).toBeNull();
  });

  it("falls back to ZIP sold $/sqft when the subject has no coordinates", () => {
    const index = buildCompIndex([1, 2, 3, 4, 5].map((i) => comp(i)));
    const e = estimateArv({ ...subject, latitude: null, longitude: null }, index, NOW)!;
    expect(e.method).toBe("ZIP sold $/sqft");
    expect(e.confidence).toBe("Low");
  });

  it("prefers sales in the subject's own subdivision/complex", () => {
    const index = buildCompIndex([
      // Closer, pricier sales in a different complex...
      ...[1, 2, 3, 4, 5, 6].map((i) => comp(i, { price: 450000 + i * 1000, subdivision: "other tower" })),
      // ...lose to the subject's own complex a bit further out.
      ...[7, 8, 9].map((i) => comp(i, { lat: 33.5 + 0.004 + i * 0.0001, price: 240000, subdivision: "garfield condos" })),
    ]);
    const e = estimateArv({ ...subject, subdivision: "GARFIELD  Condos" }, index, NOW)!;
    expect(e.sameSubdivision).toBe(true);
    expect(e.compCount).toBe(3);
    expect(e.arv).toBe(240000);
  });

  it("does not comp a condo against other complexes more than 0.5 mi away", () => {
    const far = [1, 2, 3].map((i) => comp(i, { lat: 33.5 + 0.010 + i * 0.001, dwelling: "Condo" }));
    const condo = { ...subject, dwellingType: "Condo" };
    // Falls through to the ZIP-level fallback (too few ZIP sales here -> null).
    expect(estimateArv(condo, buildCompIndex(far), NOW)).toBeNull();
    expect(estimateArv(condo, buildCompIndex(far.map((c) => ({ ...c, subdivision: "same" }))), NOW)).toBeNull();
    expect(estimateArv({ ...condo, subdivision: "Same" }, buildCompIndex(far.map((c) => ({ ...c, subdivision: "same" }))), NOW)?.sameSubdivision).toBe(true);
  });

  it("returns null without usable square footage", () => {
    expect(estimateArv({ ...subject, sqft: null }, buildCompIndex([comp(1)]), NOW)).toBeNull();
  });
});

describe("subdivisionKey", () => {
  it("normalizes case/spacing and drops placeholders", () => {
    expect(subdivisionKey("  Garfield   CONDOS ")).toBe("garfield condos");
    expect(subdivisionKey("N/A")).toBeNull();
    expect(subdivisionKey(null)).toBeNull();
  });
});
