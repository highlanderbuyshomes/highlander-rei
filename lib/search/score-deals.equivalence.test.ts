import { describe, expect, it } from "vitest";
import { hasDistressLanguage } from "@/lib/distress";
import { median, normalizeStatus, scoreDeals } from "./score-deals";
import type { DealCandidate, ListingRecord } from "./types";

/**
 * The ORIGINAL O(n^2) implementation, verbatim, kept as the oracle. The ONLY
 * deliberate difference is the final comparator: the original sorted by
 * dealScore alone; the new implementation (item I1) adds an id-ascending
 * tiebreak for deterministic Load-more pagination, so the reference uses the
 * same final ordering. Everything else (every score field) must be identical.
 */
function scoreDealsReference(listings: ListingRecord[], threshold: number): DealCandidate[] {
  const ppsfRows = listings.filter((item) => item.listPrice && item.sqft).map((item) => ({
    zip: item.zip,
    type: item.dwellingType,
    value: item.listPrice! / item.sqft!,
  }));

  return listings.map((listing) => {
    const pricePerSqft = listing.listPrice && listing.sqft ? listing.listPrice / listing.sqft : null;
    const pocketRows = ppsfRows.filter((row) => row.zip === listing.zip && row.type === listing.dwellingType);
    const comparableRows = pocketRows.length >= 2 ? pocketRows : ppsfRows.filter((row) => row.type === listing.dwellingType);
    const pocketPricePerSqft = median(comparableRows.map((row) => row.value)) ?? median(ppsfRows.map((row) => row.value));
    const modeledArv = listing.sqft && pocketPricePerSqft ? listing.sqft * pocketPricePerSqft : null;
    const arv = listing.estimatedArv ?? modeledArv;
    const arvSource: DealCandidate["arvSource"] = listing.estimatedArv ? "Property estimate" : modeledArv ? "Pocket $/sqft model" : "Insufficient data";
    const listToArvPct = listing.listPrice && arv ? (listing.listPrice / arv) * 100 : null;
    const rule70Price = arv ? arv * (threshold / 100) : null;
    const rule70Spread = rule70Price != null && listing.listPrice != null ? rule70Price - listing.listPrice : null;
    const ppsfDiscountPct = pricePerSqft && pocketPricePerSqft ? ((pocketPricePerSqft - pricePerSqft) / pocketPricePerSqft) * 100 : null;
    const conditionSignal = listing.distressSignal ?? hasDistressLanguage(listing.remarks);
    const status = normalizeStatus(listing.status);
    const priceReductionPct = listing.originalListPrice && listing.listPrice && listing.originalListPrice > listing.listPrice ? ((listing.originalListPrice - listing.listPrice) / listing.originalListPrice) * 100 : 0;
    const reasons: string[] = [];
    let score = 0;

    if (listToArvPct != null) {
      if (listToArvPct <= threshold) { score += 50 + Math.min(15, threshold - listToArvPct); reasons.push(`${Math.round(listToArvPct)}% of projected ARV`); }
      else if (listToArvPct <= threshold + 10) { score += 32; reasons.push(`${Math.round(listToArvPct)}% of projected ARV`); }
      else if (listToArvPct <= threshold + 20) score += 15;
    }
    if (ppsfDiscountPct != null && ppsfDiscountPct >= 15) { score += Math.min(16, Math.round(ppsfDiscountPct / 2)); reasons.push(`${Math.round(ppsfDiscountPct)}% below pocket $/sqft`); }
    if (["Expired", "Canceled"].includes(status)) { score += 14; reasons.push(`${status} listing`); }
    if ((listing.dom ?? 0) >= 60) { score += 8; reasons.push(`${listing.dom} days on market`); }
    if ((listing.estimatedEquityPct ?? 0) >= 40) { score += 7; reasons.push(`${Math.round(listing.estimatedEquityPct!)}% estimated equity`); }
    if (listing.ownerOccupied === false) { score += 4; reasons.push("Absentee owner"); }
    if (conditionSignal) { score += 12; reasons.push("Fixer / condition language"); }
    if (priceReductionPct >= 5) { score += 6; reasons.push(`${Math.round(priceReductionPct)}% price reduction`); }

    score = Math.min(99, score);
    const priority: DealCandidate["priority"] = listToArvPct != null && listToArvPct <= threshold ? "Target now" : score >= 65 ? "High" : score >= 38 ? "Watch" : "Low";
    return { ...listing, arv, arvSource, listToArvPct, rule70Price, rule70Spread, pricePerSqft, pocketPricePerSqft, ppsfDiscountPct, dealScore: score, priority, reasons: reasons.slice(0, 4) };
  }).sort((a, b) => b.dealScore - a.dealScore || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// mulberry32 seeded PRNG
function prng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ZIPS = ["85018", "85016", "85251", "85254", "85331", "85331 "];
const TYPES = ["Single Family", "Townhouse", "Condo", "Manufactured"];
const STATUSES = ["Active", "Pending", "Coming Soon", "Expired", "Canceled", "Withdrawn", "Closed", "Active Under Contract", ""];

function generate(n: number, seed: number): ListingRecord[] {
  const rnd = prng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  return Array.from({ length: n }, (_, i) => {
    const r = rnd();
    const sqft = r < 0.12 ? null : r < 0.18 ? 0 : Math.round(600 + rnd() * 3400);
    const p = rnd();
    const listPrice = p < 0.1 ? null : p < 0.13 ? 0 : Math.round((100000 + rnd() * 900000) / 1000) * 1000;
    const o = rnd();
    return {
      id: `id-${String(Math.floor(rnd() * n * 0.9)).padStart(6, "0")}-${i % 7}`, // some tied/near ids
      mlsNumber: "", status: pick(STATUSES), listPrice, dom: rnd() < 0.2 ? null : Math.floor(rnd() * 150),
      listDate: null, address: "", city: "", state: "", zip: pick(ZIPS), subdivision: null,
      dwellingType: pick(TYPES), beds: null, baths: null, sqft, lotSqft: null, pool: null, interiorLevels: null,
      yearBuilt: null, latitude: null, longitude: null, ownerName: null,
      estimatedEquityPct: rnd() < 0.3 ? null : Math.round(rnd() * 100),
      ownerOccupied: rnd() < 0.3 ? null : rnd() < 0.5,
      estimatedArv: rnd() < 0.35 ? Math.round(150000 + rnd() * 1000000) : rnd() < 0.05 ? 0 : undefined,
      originalListPrice: o < 0.5 ? null : listPrice ? Math.round(listPrice * (0.9 + rnd() * 0.3)) : null,
      distressSignal: rnd() < 0.25 ? true : rnd() < 0.5 ? false : undefined,
      remarks: rnd() < 0.1 ? "needs TLC, sold as-is" : null,
      source: "reso",
    } satisfies ListingRecord;
  });
}

describe("scoreDeals equivalence with the original implementation", () => {
  it.each([50, 70])("matches the reference exactly at threshold %i", (threshold) => {
    for (const seed of [1, 2, 3]) {
      const listings = generate(3000, seed);
      const actual = scoreDeals(listings, threshold);
      const expected = scoreDealsReference(listings, threshold);
      expect(actual).toEqual(expected);
      expect(actual.map((d) => d.id)).toEqual(expected.map((d) => d.id));
    }
  });

  it("handles degenerate inputs like the reference", () => {
    expect(scoreDeals([], 70)).toEqual(scoreDealsReference([], 70));
    const one = generate(1, 9);
    expect(scoreDeals(one, 70)).toEqual(scoreDealsReference(one, 70));
  });

  it("breaks score ties by id ascending", () => {
    const base = generate(1, 5)[0];
    const tied = ["b", "c", "a"].map((id) => ({ ...base, id, listPrice: null, sqft: null, estimatedArv: undefined, distressSignal: false, dom: null, status: "Active", estimatedEquityPct: null, ownerOccupied: null, originalListPrice: null, remarks: null }));
    expect(scoreDeals(tied, 70).map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("scores 25,000 listings well under the bound (was O(n^2))", () => {
    const listings = generate(25000, 42);
    const start = performance.now();
    scoreDeals(listings, 70);
    expect(performance.now() - start).toBeLessThan(5000);
  });
});
